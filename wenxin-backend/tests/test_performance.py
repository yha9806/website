"""
Performance Benchmark Tests for VULCA-Rankings Integration
"""

import asyncio
import time
import httpx
import statistics
from typing import List, Dict, Any


BASE_URL = "http://localhost:8001"


class PerformanceBenchmark:
    """Performance benchmark tests"""
    
    def __init__(self):
        self.results: Dict[str, List[float]] = {}
    
    async def measure_request(self, url: str, name: str, iterations: int = 10) -> Dict[str, float]:
        """Measure request performance"""
        times = []
        
        async with httpx.AsyncClient() as client:
            # Warm up
            await client.get(url)
            
            # Measure
            for _ in range(iterations):
                start = time.perf_counter()
                response = await client.get(url)
                end = time.perf_counter()
                
                if response.status_code == 200:
                    times.append((end - start) * 1000)  # Convert to ms
        
        if times:
            return {
                "name": name,
                "avg": statistics.mean(times),
                "min": min(times),
                "max": max(times),
                "median": statistics.median(times),
                "stdev": statistics.stdev(times) if len(times) > 1 else 0
            }
        return {"name": name, "error": "No successful requests"}
    
    async def test_cache_performance(self) -> Dict[str, Any]:
        """Test cache hit vs miss performance"""
        url = f"{BASE_URL}/api/v1/models/?limit=10"
        
        # Clear cache (first request)
        async with httpx.AsyncClient() as client:
            await client.get(f"{BASE_URL}/api/v1/models/?limit=10&_nocache={time.time()}")
        
        # Test cache miss (cold)
        cold_result = await self.measure_request(
            f"{url}&_nocache={time.time()}", 
            "Cache Miss (Cold)",
            iterations=5
        )
        
        # Test cache hit (warm)
        warm_result = await self.measure_request(
            url,
            "Cache Hit (Warm)",
            iterations=10
        )
        
        # Calculate improvement
        if "avg" in cold_result and "avg" in warm_result:
            improvement = ((cold_result["avg"] - warm_result["avg"]) / cold_result["avg"]) * 100
            return {
                "cold": cold_result,
                "warm": warm_result,
                "improvement": f"{improvement:.1f}%"
            }
        
        return {"cold": cold_result, "warm": warm_result}
    
    async def test_vulca_data_overhead(self) -> Dict[str, Any]:
        """Test performance impact of including VULCA data"""
        
        # Without VULCA
        without_vulca = await self.measure_request(
            f"{BASE_URL}/api/v1/models/?limit=20",
            "Without VULCA",
            iterations=10
        )
        
        # With VULCA
        with_vulca = await self.measure_request(
            f"{BASE_URL}/api/v1/models/?limit=20&include_vulca=true",
            "With VULCA",
            iterations=10
        )
        
        # Calculate overhead
        if "avg" in without_vulca and "avg" in with_vulca:
            overhead = ((with_vulca["avg"] - without_vulca["avg"]) / without_vulca["avg"]) * 100
            return {
                "without_vulca": without_vulca,
                "with_vulca": with_vulca,
                "overhead": f"{overhead:.1f}%"
            }
        
        return {"without_vulca": without_vulca, "with_vulca": with_vulca}
    
    async def test_concurrent_requests(self, concurrent: int = 10) -> Dict[str, Any]:
        """Test performance under concurrent load"""
        url = f"{BASE_URL}/api/v1/models/?limit=10"
        
        async def make_request():
            async with httpx.AsyncClient() as client:
                start = time.perf_counter()
                response = await client.get(url)
                end = time.perf_counter()
                return (end - start) * 1000 if response.status_code == 200 else None
        
        # Run concurrent requests
        start_total = time.perf_counter()
        tasks = [make_request() for _ in range(concurrent)]
        results = await asyncio.gather(*tasks)
        end_total = time.perf_counter()
        
        # Filter successful requests
        times = [t for t in results if t is not None]
        
        if times:
            return {
                "concurrent_requests": concurrent,
                "total_time": (end_total - start_total) * 1000,
                "avg_response_time": statistics.mean(times),
                "min_response_time": min(times),
                "max_response_time": max(times),
                "success_rate": f"{(len(times) / concurrent) * 100:.1f}%"
            }
        
        return {"concurrent_requests": concurrent, "error": "All requests failed"}
    
    async def test_pagination_performance(self) -> List[Dict[str, Any]]:
        """Test pagination performance"""
        results = []
        
        for page_size in [5, 10, 20, 50]:
            result = await self.measure_request(
                f"{BASE_URL}/api/v1/models/?limit={page_size}",
                f"Page Size {page_size}",
                iterations=5
            )
            results.append(result)
        
        return results
    
    def print_results(self, results: Dict[str, Any]):
        """Pretty print benchmark results"""
        print("\n" + "=" * 60)
        print("PERFORMANCE BENCHMARK RESULTS")
        print("=" * 60)
        
        def print_metric(name: str, data: Dict):
            if "error" in data:
                print(f"\n{name}: ERROR - {data['error']}")
            elif "avg" in data:
                print(f"\n{name}:")
                print(f"  Average: {data['avg']:.2f} ms")
                print(f"  Median:  {data['median']:.2f} ms")
                print(f"  Min:     {data['min']:.2f} ms")
                print(f"  Max:     {data['max']:.2f} ms")
                if data.get('stdev', 0) > 0:
                    print(f"  StdDev:  {data['stdev']:.2f} ms")
        
        # Cache Performance
        if "cache" in results:
            print("\n### CACHE PERFORMANCE ###")
            cache_data = results["cache"]
            if "cold" in cache_data:
                print_metric("Cache Miss (Cold)", cache_data["cold"])
            if "warm" in cache_data:
                print_metric("Cache Hit (Warm)", cache_data["warm"])
            if "improvement" in cache_data:
                print(f"\nCache Improvement: {cache_data['improvement']}")
        
        # VULCA Overhead
        if "vulca_overhead" in results:
            print("\n### VULCA DATA OVERHEAD ###")
            overhead_data = results["vulca_overhead"]
            if "without_vulca" in overhead_data:
                print_metric("Without VULCA", overhead_data["without_vulca"])
            if "with_vulca" in overhead_data:
                print_metric("With VULCA", overhead_data["with_vulca"])
            if "overhead" in overhead_data:
                print(f"\nVULCA Overhead: {overhead_data['overhead']}")
        
        # Concurrent Requests
        if "concurrent" in results:
            print("\n### CONCURRENT REQUESTS ###")
            concurrent_data = results["concurrent"]
            print(f"Concurrent Requests: {concurrent_data.get('concurrent_requests', 'N/A')}")
            print(f"Total Time: {concurrent_data.get('total_time', 0):.2f} ms")
            print(f"Avg Response Time: {concurrent_data.get('avg_response_time', 0):.2f} ms")
            print(f"Success Rate: {concurrent_data.get('success_rate', 'N/A')}")
        
        # Pagination
        if "pagination" in results:
            print("\n### PAGINATION PERFORMANCE ###")
            for page_result in results["pagination"]:
                if "avg" in page_result:
                    print(f"{page_result['name']}: {page_result['avg']:.2f} ms")
        
        print("\n" + "=" * 60)


async def run_benchmarks():
    """Run all performance benchmarks"""
    benchmark = PerformanceBenchmark()
    results = {}
    
    print("Running Performance Benchmarks...")
    print("Please ensure the backend server is running on port 8001")
    print("-" * 60)
    
    try:
        # Test cache performance
        print("\n1. Testing cache performance...")
        results["cache"] = await benchmark.test_cache_performance()
        print("   [OK] Complete")
        
        # Test VULCA overhead
        print("2. Testing VULCA data overhead...")
        results["vulca_overhead"] = await benchmark.test_vulca_data_overhead()
        print("   [OK] Complete")
        
        # Test concurrent requests
        print("3. Testing concurrent requests...")
        results["concurrent"] = await benchmark.test_concurrent_requests(concurrent=20)
        print("   [OK] Complete")
        
        # Test pagination
        print("4. Testing pagination performance...")
        results["pagination"] = await benchmark.test_pagination_performance()
        print("   [OK] Complete")
        
        # Print results
        benchmark.print_results(results)
        
        # Performance assertions
        print("\n### PERFORMANCE VALIDATION ###")
        
        # Check cache improvement
        if "cache" in results and "improvement" in results["cache"]:
            improvement = float(results["cache"]["improvement"].rstrip('%'))
            if improvement > 20:
                print(f"[OK] Cache improvement ({improvement:.1f}%) meets target (>20%)")
            else:
                print(f"[FAIL] Cache improvement ({improvement:.1f}%) below target (>20%)")
        
        # Check VULCA overhead
        if "vulca_overhead" in results and "overhead" in results["vulca_overhead"]:
            overhead = float(results["vulca_overhead"]["overhead"].rstrip('%'))
            if overhead < 50:
                print(f"[OK] VULCA overhead ({overhead:.1f}%) within acceptable range (<50%)")
            else:
                print(f"[FAIL] VULCA overhead ({overhead:.1f}%) exceeds limit (<50%)")
        
        # Check response times
        if "concurrent" in results and "avg_response_time" in results["concurrent"]:
            avg_time = results["concurrent"]["avg_response_time"]
            if avg_time < 500:
                print(f"[OK] Average response time ({avg_time:.0f}ms) meets SLA (<500ms)")
            else:
                print(f"[FAIL] Average response time ({avg_time:.0f}ms) exceeds SLA (<500ms)")
        
        return True
        
    except Exception as e:
        print(f"\n[ERROR] Benchmark failed: {e}")
        return False


if __name__ == "__main__":
    success = asyncio.run(run_benchmarks())
    exit(0 if success else 1)