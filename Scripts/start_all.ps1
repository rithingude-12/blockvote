# Start Ganache
Write-Host "Starting Ganache..."
Start-Process -NoNewWindow -FilePath "npx.cmd" -ArgumentList "ganache-cli", "--port", "8545", "--networkId", "1337", "--deterministic"

# Start Backend
Write-Host "Starting FastAPI Backend..."
Set-Location -Path ".\backend"
Start-Process -NoNewWindow -FilePath ".\venv\Scripts\python.exe" -ArgumentList "-m", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"

# Start Frontend
Write-Host "Starting React Frontend..."
Set-Location -Path "..\frontend"
$env:PORT="3000"
Start-Process -NoNewWindow -FilePath "npm.cmd" -ArgumentList "start"

Write-Host "All services started!"
Set-Location -Path ".."
