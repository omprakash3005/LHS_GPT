# AI Document Parser

A FastAPI-based application for intelligent document analysis using Groq API.

## Features

- Document parsing and analysis
- Multi-format support (PDF, DOCX, Excel, images)
- AI-powered document insights using Llama models
- RESTful API interface

## Prerequisites

- Python 3.8+
- Groq API key

## Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd Chat
```

2. Create a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Create a `.env` file with your Groq API key:
```env
GROQ_API_KEY=your_api_key_here
```

## Usage

Start the development server:
```bash
uvicorn main:app --reload
```

The API will be available at `http://localhost:8000`

Visit `http://localhost:8000/docs` for interactive API documentation.

## Project Structure

```
.
├── main.py                 # FastAPI application entry point
├── core/
│   └── groq_client.py     # Groq API client
├── routers/
│   └── parser.py          # Document parsing endpoints
├── services/
│   ├── extractor.py       # Data extraction logic
│   ├── file_parser.py     # File parsing utilities
│   └── utils.py           # Helper functions
├── schemas/
│   └── response.py        # API response models
└── prompt_optimizer_v7/
    └── optimize.py        # Prompt optimization
```

## API Endpoints

- `GET /` - Health check
- `POST /parse` - Parse and analyze documents
- `POST /optimize` - Optimize prompts

## Environment Variables

- `GROQ_API_KEY` - Your Groq API key (required)

## License

Add your license here

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
