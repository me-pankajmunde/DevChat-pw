# Ollama Local Models Setup

DevChat now supports running local AI models using Ollama! This feature allows you to use open-source models like Llama, Mistral, Phi, and more on your own hardware without relying on external APIs.

## Prerequisites

1. **Install Ollama**: Download and install Ollama from [https://ollama.ai](https://ollama.ai)
   - macOS/Linux: `curl -fsSL https://ollama.ai/install.sh | sh`
   - Windows: Download the installer from the website

2. **Pull Models**: Download models you want to use
   ```bash
   ollama pull llama3.2
   ollama pull mistral
   ollama pull codellama
   ollama pull phi3
   ```

3. **Start Ollama**: Make sure Ollama is running
   ```bash
   ollama serve
   ```
   By default, Ollama runs on `http://localhost:11434`

## Configuration in DevChat

### Method 1: Using the Ollama Dialog (Recommended)

1. Open **Settings** (gear icon)
2. Select **API Provider**: Choose "Ollama (Local Models)"
3. Click **"Connect Ollama"** button
4. Either:
   - Enter a custom URL (e.g., `http://localhost:11434`) and click "Connect"
   - Or click "Scan Local Network" to auto-discover Ollama servers

5. Select a model from the list of available models
6. Click **"Test Connection"** to verify
7. Click **"Save Settings"**

### Method 2: Manual Configuration

1. Open **Settings** (gear icon)
2. Select **API Provider**: "Ollama (Local Models)"
3. Set **API Endpoint**: `http://localhost:11434`
4. **API Key**: Leave blank (not required for Ollama)
5. Enter **Model** name manually (e.g., `llama3.2`)
6. Click **"Test Connection"** and then **"Save Settings"**

## Network Scanning

The Ollama dialog can scan your local network for running Ollama instances on common ports:
- Port 11434 (default)
- Port 11435
- Port 11436

**Note**: Due to browser security restrictions, network scanning is limited to localhost. To connect to remote Ollama servers on your LAN, enter the URL manually (e.g., `http://192.168.1.100:11434`).

## Available Models

Once connected, DevChat will automatically fetch the list of available models from your Ollama server. You can pull more models using the Ollama CLI:

```bash
# List available models
ollama list

# Pull a new model
ollama pull <model-name>

# Examples
ollama pull llama3.2
ollama pull mistral
ollama pull codellama:7b
ollama pull phi3:mini
```

Visit [Ollama Library](https://ollama.ai/library) to browse available models.

## Switching Between Models

You can easily switch between models using the **Model Selector** dropdown at the top of the chat interface. The list will automatically update based on your Ollama server's available models.

## Troubleshooting

### Connection Issues

- **Error: "Failed to connect to Ollama server"**
  - Ensure Ollama is running: `ollama serve`
  - Check if the port is correct (default: 11434)
  - Try accessing `http://localhost:11434/api/tags` in your browser

### No Models Found

- Pull models using: `ollama pull <model-name>`
- Verify models are installed: `ollama list`
- Restart the Ollama service

### Slow Response

- Local models require significant RAM and CPU/GPU resources
- Consider using smaller models (e.g., `phi3:mini` instead of `llama3.2:70b`)
- Check system resources while the model is running

### CORS Errors

If you encounter CORS errors when connecting to a remote Ollama server:
1. Set the `OLLAMA_ORIGINS` environment variable:
   ```bash
   export OLLAMA_ORIGINS="*"
   ollama serve
   ```

## Performance Tips

1. **GPU Acceleration**: Ollama automatically uses GPU if available (NVIDIA, AMD, or Apple Silicon)
2. **Model Size**: Smaller models respond faster but may be less capable
   - Small: 3B-7B parameters (fast, good for simple tasks)
   - Medium: 13B-34B parameters (balanced)
   - Large: 70B+ parameters (slow, most capable)
3. **Memory**: Ensure you have enough RAM (at least 8GB for small models, 16GB+ for larger ones)

## Advantages of Local Models

✅ **Privacy**: Your data never leaves your machine  
✅ **Cost**: No API fees or usage limits  
✅ **Speed**: No network latency (once model is loaded)  
✅ **Offline**: Works without internet connection  
✅ **Customization**: Fine-tune models for your use case  

## Comparison: Ollama vs OpenAI API

| Feature | Ollama | OpenAI API |
|---------|--------|------------|
| Cost | Free | Pay per token |
| Privacy | 100% local | Data sent to OpenAI |
| Internet | Not required | Required |
| Hardware | Runs on your machine | Cloud-based |
| Model variety | Open-source models | GPT-3.5, GPT-4, etc. |
| Setup | Requires installation | Just need API key |

## Recommended Models by Use Case

- **Coding**: `codellama`, `deepseek-coder`
- **General Chat**: `llama3.2`, `mistral`, `phi3`
- **Fast Responses**: `phi3:mini`, `gemma:2b`
- **Best Quality**: `llama3.2:70b`, `mixtral:8x7b`
- **Lightweight**: `tinyllama`, `phi3:mini`

## Advanced Configuration

### Custom Ollama Server

If running Ollama on a different machine:
1. Start Ollama with network access:
   ```bash
   OLLAMA_HOST=0.0.0.0:11434 ollama serve
   ```
2. In DevChat settings, enter: `http://<server-ip>:11434`

### Multiple Ollama Instances

Run multiple Ollama servers on different ports:
```bash
OLLAMA_HOST=127.0.0.1:11435 ollama serve
```

Then connect to different instances by changing the endpoint in DevChat settings.

## Support

For issues with:
- **Ollama installation**: Visit [Ollama Documentation](https://github.com/ollama/ollama)
- **DevChat integration**: Check this repository's Issues section
- **Model selection**: Browse [Ollama Library](https://ollama.ai/library)

Enjoy using local AI models with DevChat! 🤖
