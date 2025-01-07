# Utils Directory Structure

```
app/utils/
├── agent/                 # Agent core functionality
│   ├── core.ts           # Core agent classes
│   ├── types.ts          # Type definitions
│   ├── validation.ts     # Validation system
│   └── operations/       # Operation implementations
│       ├── file.ts
│       ├── screen.ts
│       ├── voice.ts
│       └── memory.ts
│
├── db/                   # Database utilities
│   ├── client.ts         # Database client
│   ├── models/          # Database models
│   └── migrations/      # Database migrations
│
├── io/                   # Input/Output operations
│   ├── file/            # File operations
│   │   ├── read.ts
│   │   ├── write.ts
│   │   └── stream.ts
│   ├── screen/          # Screen operations
│   │   ├── capture.ts
│   │   └── process.ts
│   └── voice/           # Voice operations
│       ├── record.ts
│       └── transcribe.ts
│
├── memory/              # Memory management
│   ├── cache.ts        # Caching system
│   ├── context.ts      # Context management
│   └── storage.ts      # Storage management
│
├── security/            # Security utilities
│   ├── auth.ts         # Authentication
│   ├── permissions.ts  # Permission checking
│   └── validation.ts   # Security validation
│
├── media/              # Media processing
│   ├── image.ts       # Image processing
│   ├── video.ts       # Video processing
│   └── audio.ts       # Audio processing
│
└── common/             # Shared utilities
    ├── logger.ts      # Logging
    ├── errors.ts      # Error handling
    ├── constants.ts   # Constants
    └── helpers.ts     # Helper functions
```

## Directory Descriptions

### agent/
Core agent functionality including context management, validation, and operation execution.

### db/
Database-related utilities, models, and migrations for PostgreSQL integration.

### io/
Input/Output operations for file system, screen capture, and voice interactions.

### memory/
Memory management utilities for caching, context preservation, and storage.

### security/
Security-related utilities for authentication, permissions, and validation.

### media/
Media processing utilities for handling images, videos, and audio.

### common/
Shared utilities used across the application. 