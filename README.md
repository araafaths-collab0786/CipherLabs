# Cipher Labs
### Digital Forensics and Data Sanitization

**SECURE THE PAST. PROTECT THE FUTURE**

Cipher Labs is a Windows-based digital forensics and data sanitization application developed to explore secure file sanitization, controlled file recovery, integrity verification, and evidence-based audit reporting.

The project addresses the challenges of securely handling digital data while maintaining transparency, traceability, and verifiable operation records.

---

## Project Overview

Digital data deletion does not necessarily mean permanent data destruction. Conventional deletion methods may leave recoverable information behind, creating potential privacy and security risks.

Cipher Labs aims to provide a unified platform for exploring secure data sanitization and file recovery workflows, with verification mechanisms and structured audit records.

The application combines a desktop interface with a Python-based backend to manage operations, perform controlled simulations, verify file integrity, and generate reports.

## Problem Statement

**SIH26149 – Integrated Secure Data Erasure and Advanced File Recovery Tool**

The problem focuses on developing an integrated solution for secure data erasure and advanced file recovery, addressing the need for reliable data sanitization, recovery assessment, verification, and accountability.

Cipher Labs approaches this challenge through a modular desktop application that brings together sanitization simulations, controlled recovery testing, integrity verification, and audit reporting.

## Key Features

### 1. Dashboard
- Centralized application overview.
- Access to major functional modules.
- Operation status and activity visibility.

### 2. Secure Erasure
- Controlled file sanitization simulations.
- Managed application-data workspace.
- Before-and-after file integrity comparisons.
- Operation status tracking.

### 3. File Recovery
- Controlled recovery testing using generated sample images.
- Recovery workflow experimentation.
- Recovery result tracking.

### 4. Verification Center
- Operation result verification.
- Simulation check results.
- SHA-256 integrity comparison.
- Verification records and evidence tracking.

### 5. Reports & Audit
- Structured operation reports.
- JSON and PDF report generation.
- Activity and audit records.
- Traceable operation history.

### 6. Device Management
- Application-generated device identification.
- Operating system and application version information.

### 7. Settings
- Application configuration.
- User preferences and account-related settings.

## Technology Stack

| Layer | Technologies |
|---|---|
| Desktop Framework | Tauri v2 |
| Frontend | React 18, TypeScript |
| Build Tool | Vite |
| Styling | Tailwind CSS |
| Animations | Framer Motion |
| Icons | Lucide React |
| Backend | Python 3.11, FastAPI |
| Validation | Pydantic v2 |
| Database | MongoDB Atlas |
| Database Driver | Motor (Async MongoDB) |
| Server | Uvicorn |
| Backend Packaging | PyInstaller |
| Desktop Packaging | NSIS / Tauri |
| Integrity Verification | SHA-256 |

## System Architecture

Cipher Labs follows a modular desktop architecture.

```text
          CIPHER LABS
               |
       Tauri Desktop Shell
               |
       React + TypeScript
               |
        Rust Integration
               |
       FastAPI Sidecar
       127.0.0.1:8765
               |
        Backend Services
               |
    +----------+----------+
    |          |          |
 Sanitization Recovery Verification
 Simulation   Testing    Services
    |          |          |
    +----------+----------+
               |
          MongoDB Atlas
               |
       Reports & Audit
```

### Architecture Components

- **Frontend:** Provides the interactive desktop interface and user workflows.
- **Tauri and Rust:** Handle desktop application integration and backend sidecar lifecycle.
- **FastAPI:** Processes application requests and manages backend operations.
- **MongoDB Atlas:** Stores application records and related operational data.
- **Application Data Workspace:** Provides an isolated environment for generated test files and simulation workflows.

## How It Works

1. **Access:** The user opens Cipher Labs and accesses the desktop application.
2. **Select Operation:** The user selects secure erasure simulation or file recovery testing.
3. **Execute:** The backend processes the requested operation within the controlled application environment.
4. **Verify:** The application performs the applicable checks and SHA-256 integrity comparisons.
5. **Generate Evidence:** Operation details and verification results are recorded.
6. **Report:** The user can access structured reports and audit information.

## Security & Verification Approach

Cipher Labs incorporates verification mechanisms to improve transparency and accountability.

**SHA-256 Integrity Verification**

SHA-256 cryptographic hashing is used to compare file contents and determine whether their integrity has changed.

**Audit Records**

Operation details and verification outcomes are maintained to support traceability.

**Controlled Execution**

Testing operations are restricted to the application's managed data workspace.

> Important: A successful SHA-256 comparison establishes file integrity or detects content changes. It does not independently prove secure erasure.

## Current Implementation Scope

Cipher Labs is currently designed as a Windows desktop application.

| Capability | Current Scope |
|---|---|
| Desktop application | Windows 10 (21H2+) / Windows 11, x64 |
| Secure erasure | Simulation-based |
| File recovery | Generated test-image recovery |
| Integrity verification | SHA-256 |
| Reports | JSON / PDF |
| Audit tracking | Application operation records |
| Backend | FastAPI sidecar |
| Database | MongoDB Atlas |

### Important Limitations

- Secure erasure is currently implemented as a controlled simulation.
- Real physical disk sanitization is not enabled.
- Raw-drive scanning and direct device access are not enabled.
- Recovery testing is restricted to generated sample files within the managed application workspace.
- Simulation results must not be interpreted as proof of actual physical data destruction.

These boundaries are intentional to ensure controlled and safe testing.

## Installation & Setup

### Installed Desktop Runtime Configuration

The Windows installer does not contain MongoDB credentials. On first launch, Cipher Labs creates a per-user configuration file at:

```text
%APPDATA%\com.cipherlabs.desktop\cipherlabs.env
```

Edit that file to connect the desktop app to MongoDB Atlas:

```dotenv
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>/<database>?retryWrites=true&w=majority
MONGODB_DB_NAME=cipher_labs
JWT_SECRET=<a unique, randomly generated secret>
```

If `JWT_SECRET` is left blank, the app generates and saves a unique per-user key under its application data directory. Keep both configuration files private. Restart Cipher Labs after editing the config.

### Prerequisites

- Windows 10 (21H2 or later) / Windows 11 (64-bit).
- Node.js and npm.
- Python 3.11.
- Rust toolchain.
- Microsoft C++ Build Tools.
- MongoDB Atlas account and backend configuration.

### 1. Clone the Repository

```bash
git clone https://github.com/YOUR_USERNAME/Cipher-Labs.git
cd Cipher-Labs
```

### 2. Configure the Backend

Navigate to the backend directory:

```powershell
cd backend
```

Create and activate a virtual environment:

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
```

Install the backend dependencies:

```powershell
pip install -r requirements.txt
```

Configure the required MongoDB connection settings and other backend environment variables using the project's environment configuration.

### 3. Configure the Frontend

Navigate to the frontend directory and install dependencies:

```bash
cd frontend
npm install
```

Configure the frontend environment according to the project's environment example, if required.

### 4. Run the Application

Start the FastAPI backend using the project's configured entry point.

Start the frontend development server:

```bash
npm run dev
```

For desktop development, use the configured Tauri development command from the frontend project.

### 5. Build the Backend Sidecar

From the project root, run:

```powershell
.\scripts\build_backend.ps1
```

This script builds the backend sidecar using PyInstaller.

Follow the configured Tauri build process to package the Windows desktop installer.

> Note: The exact environment variable names, backend entry point, and build commands should match the repository's current configuration.

## Project Structure

```text
Cipher-Labs/
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   └── ...
│   │
│   └── src-tauri/
│       └── ...
│
├── backend/
│   ├── cipher_backend/
│   │   ├── main.py
│   │   ├── config.py
│   │   └── ...
│   │
│   └── requirements.txt
│
├── scripts/
│   └── build_backend.ps1
│
├── tests/
│
├── README.md
└── ...
```

*The structure above illustrates the main architectural areas; individual directories may differ in the current repository.*

## Future Enhancements

- Advanced secure sanitization methods with standards-based validation.
- Expanded file recovery capabilities.
- Improved verification and evidence generation.
- Enhanced audit trail and reporting.
- Broader device and storage compatibility.
- Additional digital forensics capabilities.

These are proposed enhancements and are not claims of currently implemented functionality.

## Project Information

| Attribute | Details |
|---|---|
| Project Name | Cipher Labs |
| Problem Statement | SIH26149 |
| Domain | Digital Forensics & Data Sanitization |
| Platform | Windows Desktop |
| Architecture | Tauri + React + FastAPI |
| Database | MongoDB Atlas |
| Project Type | Academic / Innovation Project |

## Contributing

Contributions, suggestions, and technical discussions are welcome.

1. Fork the repository.
2. Create a feature branch.
3. Implement and test your changes.
4. Submit a pull request with a clear description.

Please ensure that modifications respect the application's controlled execution and safety boundaries.

## License

A license has not yet been specified. All rights are reserved by the project owners unless a license is added to this repository.

---

**Cipher Labs**

*SECURE THE PAST. PROTECT THE FUTURE*

Building a more transparent and accountable approach to digital data sanitization and forensic verification.
