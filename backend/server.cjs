// File: backend/server.cjs
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

// Import configuration and utilities
const envConfig = require('./config/environment.cjs');
const logger = require('./utils/logger.cjs');
const ErrorHandler = require('./utils/error-handler.cjs');
const { PATHS, API_ENDPOINTS } = require('./config/constants.cjs');
const { ConsoleHelper, MODULES } = require('./utils/console-helper.cjs');

// Import routes
const recorderRoutes = require('./routes/recorder.routes.cjs');
const enhancerRoutes = require('./routes/enhancer.routes.cjs');
const testsRoutes = require('./routes/tests.routes.cjs');
const jenkinsRoutes = require('./routes/jenkins.routes.cjs');
const analyticsRoutes = require('./routes/analytics.routes.cjs');

class Server {
  constructor() {
    this.app = express();
    this.port = envConfig.server.port;
    this.host = envConfig.server.host;
    this.pidFile = path.join(__dirname, '../.server.pid');
    this.setupMiddleware();
    this.setupRoutes();
    this.setupErrorHandling();
  }

  setupMiddleware() {
    // CORS configuration
    this.app.use(cors({
      origin: envConfig.isDevelopment ? true : false, // Allow all origins in development
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization']
    }));

    // Body parsing middleware
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Request logging
    this.app.use((req, res, next) => {
      logger.info(`${req.method} ${req.url}`, {
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });
      next();
    });
  }

  setupRoutes() {
    // API Routes
    this.app.use('/api/recorder', recorderRoutes);
    this.app.use('/api/enhancer', enhancerRoutes);
    this.app.use('/api/tests', testsRoutes);
    this.app.use('/api/jenkins', jenkinsRoutes);
    this.app.use('/api/analytics', analyticsRoutes);

    // Serve static files
    this.app.use('/panel', express.static(path.join(__dirname, '../../test-results/reports')));

    // Health check endpoint
    this.app.get(API_ENDPOINTS.HEALTH, (req, res) => {
      res.json({ 
        status: 'ok', 
        message: 'Scriptify AI backend is running',
        timestamp: new Date().toISOString(),
        version: '1.0.0'
      });
    });

    // 404 handler
    this.app.use(ErrorHandler.notFound);
  }

  setupErrorHandling() {
    this.app.use(ErrorHandler.handleError);
  }

  savePid() {
    try {
      fs.writeFileSync(this.pidFile, process.pid.toString(), 'utf8');
      // Removed debug log - not needed in console output
    } catch (error) {
      logger.warn('Failed to save PID file', { error: error.message });
    }
  }

  removePid() {
    try {
      if (fs.existsSync(this.pidFile)) {
        fs.unlinkSync(this.pidFile);
        // Removed debug log - not needed in console output
      }
    } catch (error) {
      logger.warn('Failed to remove PID file', { error: error.message });
    }
  }

  async checkAndKillPortProcess() {
    try {
      const { execSync } = require('child_process');
      const portProcess = execSync(`lsof -ti :${this.port}`, { encoding: 'utf8' }).trim();
      if (portProcess) {
        ConsoleHelper.warning(MODULES.SERVER, `Port ${this.port} is in use by PID ${portProcess}, attempting to stop it...`);
        try {
          process.kill(parseInt(portProcess), 'SIGTERM');
          // Wait a bit for graceful shutdown
          await new Promise(resolve => setTimeout(resolve, 1000));
          // Check if still running
          try {
            process.kill(parseInt(portProcess), 0);
            // Still running, force kill
            process.kill(parseInt(portProcess), 'SIGKILL');
            ConsoleHelper.log(MODULES.SERVER, `Force stopped PID ${portProcess}`);
          } catch (e) {
            // Process stopped
            ConsoleHelper.log(MODULES.SERVER, `Stopped PID ${portProcess}`);
          }
        } catch (killError) {
          if (killError.code !== 'ESRCH') {
            throw killError;
          }
        }
      }
    } catch (error) {
      // No process on port or command failed - that's okay, port is free
      // Only log if it's an unexpected error
      if (error.status !== 1 && error.code !== 'ENOENT' && !error.message.includes('No such process')) {
        logger.warn('Could not check port process', { error: error.message });
      }
    }
  }

  async start() {
    // Check and kill any process using the port
    await this.checkAndKillPortProcess();
    
    // Save PID file
    this.savePid();

    this.app.listen(this.port, this.host, () => {
      logger.success(`Server started successfully`, {
        port: this.port,
        host: this.host,
        environment: envConfig.server.nodeEnv,
        url: `http://${this.host}:${this.port}`,
        pid: process.pid
      });
      ConsoleHelper.success(MODULES.SERVER, `Server running at http://${this.host}:${this.port}`);
      ConsoleHelper.log(MODULES.SERVER, `PID: ${process.pid} | Stop with: npm stop or Ctrl+C`);
    }).on('error', (error) => {
      if (error.code === 'EADDRINUSE') {
        ConsoleHelper.error(MODULES.SERVER, `Port ${this.port} is already in use`);
        console.error(`\n   Another server is running on port ${this.port}.`);
        console.error(`   Please stop it first:`);
        console.error(`   1. Find the process: lsof -i :${this.port}`);
        console.error(`   2. Stop it: kill <PID>`);
        console.error(`   3. Or use: npm stop\n`);
        logger.error('Port already in use', { port: this.port, error: error.message });
        this.removePid();
        process.exit(1);
      } else {
        ConsoleHelper.error(MODULES.SERVER, `Failed to start: ${error.message}`);
        logger.error('Server startup failed', { error: error.message });
        this.removePid();
        process.exit(1);
      }
    });

    // Graceful shutdown
    const gracefulShutdown = (signal) => {
      logger.info(`${signal} received, shutting down gracefully`);
      ConsoleHelper.warning(MODULES.SERVER, `${signal} received, shutting down...`);
      this.removePid();
      process.exit(0);
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    
    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      ConsoleHelper.error(MODULES.SERVER, `Uncaught exception: ${error.message}`);
      logger.error('Uncaught exception', { error: error.message });
      this.removePid();
      process.exit(1);
    });

    process.on('unhandledRejection', (reason, promise) => {
      ConsoleHelper.error(MODULES.SERVER, `Unhandled rejection: ${reason?.toString()}`);
      logger.error('Unhandled rejection', { reason: reason?.toString() });
      this.removePid();
      process.exit(1);
    });
  }
}

// Start the server
const server = new Server();
server.start().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
