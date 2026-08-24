@echo off
echo ===================================================
echo Pushing All Project Files to GitHub
echo ===================================================

cd /d "C:\Users\RADHARAPU SAIKRISHNA\Downloads\datasets analysis"

git init
git add .
git commit -m "Upload complete ML platform codebase"

echo.
echo ===================================================
echo Almost done!
echo Now enter your GitHub repo URL if you haven't already.
echo Example: https://github.com/YOUR_USERNAME/ml-platform.git
echo ===================================================

set /p REPO_URL="Enter your GitHub Repository URL: "

git remote remove origin 2>nul
git remote add origin %REPO_URL%
git branch -M main
git push -u origin main --force

echo.
echo ===================================================
echo SUCCESS! All files uploaded to GitHub successfully!
echo Now go back to Hugging Face / Vercel and click RETRY.
echo ===================================================
pause
