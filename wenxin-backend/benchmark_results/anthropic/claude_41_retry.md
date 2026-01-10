# Claude 4.1 Models Benchmark Report (With Retry)
**Test Date**: 2025-08-20 10:54  
**Models Tested**: 1  
**Total Tests**: 3  
**Successful Tests**: 3  
**Failed Tests**: 0  

## Retry Configuration
- Max Retries: 3
- Retry Delays: [5, 10, 20] seconds

## Test Results

### claude-opus-4-1-20250805 - poem_moon
- Status: ✅ SUCCESS
- Attempts: 1
- Score: 88.3/100
- Duration: 8.09s
- Dimensions: R:85 C:90 N:80 E:88 Cr:92 Cu:95

### claude-opus-4-1-20250805 - story_robot
- Status: ✅ SUCCESS
- Attempts: 1
- Score: 84.2/100
- Duration: 16.44s
- Dimensions: R:85 C:80 N:90 E:75 Cr:95 Cu:80

### claude-opus-4-1-20250805 - code_fibonacci
- Status: ✅ SUCCESS
- Attempts: 1
- Score: 68.3/100
- Duration: 12.29s
- Dimensions: R:70 C:85 N:60 E:50 Cr:75 Cu:80

## Model Performance Summary

| Model | Average Score | Tests Completed |
|-------|---------------|----------------|
| Claude Opus 4.1 (2025-08-05) | 80.3/100 | 3/3 |

## Notes

- Claude Opus 4.1 (claude-opus-4-1-20250805) is the latest version released on August 5, 2025
- This model improves on agentic tasks, real-world coding, and reasoning
- The model may experience high demand leading to 500/503 errors
- Retry mechanism implemented to handle transient server errors
- Note: temperature and top_p cannot be used together for Opus 4.1
