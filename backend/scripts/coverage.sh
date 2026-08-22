#!/bin/bash

echo "Running coverage analysis..."
pytest --cov=app --cov-report=html --cov-report=term-missing

echo ""
echo "Coverage report generated in htmlcov/index.html"
