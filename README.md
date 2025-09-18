# 🤖 Cortana Pro AI Assistant

> **Advanced Cortana-inspired AI Assistant with Azure AI Speech Services, WebPubSub real-time messaging, and modern React interface**

A sophisticated voice-enabled AI assistant built with modern web technologies and Azure cloud services. Features high-quality text-to-speech with Jenny Neural voice, real-time WebSocket communication, and a sleek technological interface inspired by Microsoft's Cortana.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![React](https://img.shields.io/badge/react-18.3.1-blue.svg)
![TypeScript](https://img.shields.io/badge/typescript-5.5.3-blue.svg)
![Azure](https://img.shields.io/badge/azure-ai--services-blue.svg)

## ✨ Key Features

### 🎙️ **Advanced Voice Interface**
- **Speech Recognition**: Browser-native speech-to-text with continuous listening
- **High-Quality TTS**: Azure AI Speech Services with Jenny Neural voice
- **SSML Support**: Dynamic voice styling with pitch, rate, and emotion control
- **Cross-Browser**: Compatible with Chrome, Safari, Edge, and Firefox

### 🌐 **Real-Time Communication**
- **Azure Web PubSub**: JWT-authenticated WebSocket connections
- **Group Messaging**: Multi-user real-time chat capabilities  
- **Message Echo Prevention**: Smart filtering of own messages
- **Connection Management**: Automatic reconnection and error handling

### 🎨 **Modern UI/UX**
- **Technological Theme**: Dark interface with cyan/blue accent colors
- **Animated Backgrounds**: Grid patterns and scan-line effects
- **Holographic Text**: Glowing headings and interactive elements
- **Responsive Design**: Mobile and desktop optimized
- **Inline Styling**: No external CSS dependencies

### ⚡ **Performance & Reliability**
- **Vite Build System**: Lightning-fast development and production builds
- **TypeScript**: Full type safety and excellent developer experience
- **Error Boundaries**: Graceful error handling and recovery
- **Fallback Systems**: Browser TTS fallback when Azure services unavailable

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- Azure subscription with:
  - Azure AI Speech Services resource
  - Azure Web PubSub service

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/comeredon/cortana-pro-ai.git
   cd cortana-pro-ai
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your Azure service credentials
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

5. **Open in browser**
   ```
   http://localhost:5173
   ```

## 🔧 Configuration

### Environment Variables

Create a `.env` file with your Azure service credentials:

```bash
# Azure AI Speech Services
VITE_AZURE_SPEECH_KEY=your_speech_service_key
VITE_AZURE_SPEECH_REGION=eastus

# Azure Web PubSub
VITE_WEBPUBSUB_ENDPOINT=https://your-webpubsub.webpubsub.azure.com
VITE_WEBPUBSUB_HUB_NAME=cortana
VITE_WEBPUBSUB_ACCESS_KEY=your_access_key
VITE_WEBPUBSUB_CLIENT_URL=wss://your-webpubsub.webpubsub.azure.com/client/hubs/cortana?access_token=your_jwt_token

# Development
VITE_DEBUG=true
```

### Azure Setup

1. **Create Azure AI Speech Services**
   - Go to Azure Portal → Create Resource → AI + Machine Learning → Speech
   - Copy the key and region to your `.env` file

2. **Create Azure Web PubSub Service**
   - Go to Azure Portal → Create Resource → Web PubSub
   - Configure connection strings and generate JWT tokens
   - Create a hub named `cortana`

3. **Generate JWT Token**
   - Use the Azure Web PubSub SDK or the token generator script
   - Ensure roles include: `webpubsub.sendToGroup`, `webpubsub.joinLeaveGroup`

## 🏗️ Architecture

### Technology Stack
- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Inline styles with modern CSS patterns
- **UI Components**: Radix UI with custom theming
- **Icons**: Phosphor Icons React
- **State Management**: React hooks + localStorage
- **Communication**: Azure Web PubSub WebSocket
- **AI Services**: Azure AI Speech Services
- **Deployment**: Azure Static Web Apps

### Project Structure
```
src/
├── components/
│   ├── CortanaInterface.tsx     # Main interface container
│   ├── VoiceChatSimple.tsx      # Voice interaction hub
│   ├── ConversationHistory.tsx  # Message history
│   ├── ProfileSettings.tsx      # User preferences
│   └── ui/                      # Radix UI components
├── hooks/
│   ├── useLocalStorage.ts       # Persistent storage
│   └── useDirectWebPubSub.ts    # WebSocket management
├── services/
│   └── aiService.ts             # AI communication layer
└── main.tsx                     # App entry point
```

## 🎯 Usage

### Basic Voice Interaction
1. Click the **voice button** to start recording
2. **Speak your message** clearly
3. Click **stop** or wait for automatic cutoff
4. **View transcript** in the chat interface
5. **Listen to TTS response** (when AI backend is connected)

### Advanced Features
- **Continuous mode**: Enable for hands-free operation
- **Custom voices**: Configure different Azure neural voices
- **Group chat**: Join multi-user conversations
- **Settings**: Adjust voice parameters and preferences

## 🔄 Development

### Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
npm run type-check   # TypeScript type checking
```

### Code Style
- **TypeScript strict mode** for maximum type safety
- **Inline styles** in `main.tsx` for global styling
- **Component-scoped styles** using CSS-in-JS patterns
- **Semantic HTML** for accessibility
- **Error boundaries** for graceful failure handling

### Adding New Features
1. Create components in `src/components/`
2. Add hooks in `src/hooks/` for reusable logic
3. Update types in component files
4. Test thoroughly across browsers
5. Document new environment variables

## 🚀 Deployment

### Azure Static Web Apps (Recommended)

1. **Fork this repository** to your GitHub account

2. **Create Azure Static Web App**
   - Connect to your GitHub repository
   - Set build configuration:
     - App location: `/`
     - Output location: `dist`

3. **Configure environment variables** in Azure portal
   - Add all `VITE_*` variables from your `.env`

4. **GitHub Actions** will automatically deploy on push to main

### Manual Deployment

```bash
npm run build
# Upload dist/ folder to your hosting provider
```

## 🛠️ Troubleshooting

### Common Issues

**WebPubSub Authentication Failed**
- Check JWT token expiration (tokens are time-limited)
- Verify access key and connection string
- Ensure proper roles in token: `sendToGroup`, `joinLeaveGroup`

**Azure Speech Services Not Working**
- Verify API key and region are correct
- Check browser permissions for microphone access
- Test with browser TTS fallback enabled

**Build Errors**
- Clear `node_modules` and reinstall: `rm -rf node_modules package-lock.json && npm install`
- Check TypeScript errors: `npm run type-check`
- Verify all environment variables are set

### Debug Mode

Enable debug logging by setting:
```bash
VITE_DEBUG=true
```

Check browser console for detailed connection and API logs.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Microsoft Cortana** - Inspiration for the AI assistant concept
- **Azure AI Services** - Powering high-quality speech synthesis
- **Radix UI** - Providing accessible UI components
- **Vite** - Lightning-fast build tooling
- **React Team** - Excellent frontend framework

---

**Built with ❤️ using Azure AI Services and modern web technologies**

For support and questions, please open an issue on GitHub.