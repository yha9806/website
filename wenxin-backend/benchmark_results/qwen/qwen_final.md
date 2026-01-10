# Qwen Models Benchmark Report

## Status: Not Tested

Qwen models have not been tested yet because the API key is not configured.

## How to Test Qwen Models

1. **Register for DashScope Account**
   - Visit: https://dashscope.aliyun.com/
   - Sign up for an account (requires Alibaba Cloud account)

2. **Get API Key**
   - Go to your DashScope dashboard
   - Navigate to API Keys section
   - Create a new API key

3. **Set Environment Variable**
   ```bash
   export QWEN_API_KEY='your-api-key-here'
   ```

4. **Run Tests**
   ```bash
   python test_qwen_final.py
   ```

## Available Models

The following Qwen models are configured for testing:
- **qwen-max-2025-01-25**: Latest and most capable Qwen model
- **qwen-plus**: Enhanced performance model
- **qwen-turbo**: Speed-optimized model

## API Information

- **Endpoint**: https://dashscope.aliyuncs.com/compatible-mode/v1
- **Interface**: OpenAI-compatible
- **Region**: China (Beijing)

For international users, use:
- **Endpoint**: https://dashscope-intl.aliyuncs.com/compatible-mode/v1
- **Region**: Singapore
