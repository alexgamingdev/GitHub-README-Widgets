$ErrorActionPreference = "Stop"

Add-Type -AssemblyName System.Drawing

$outputPath = Join-Path (Split-Path -Parent $PSScriptRoot) "site\social-preview.png"
$bitmap = New-Object System.Drawing.Bitmap(1280, 640)
$graphics = [System.Drawing.Graphics]::FromImage($bitmap)
$graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$graphics.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit
$graphics.Clear([System.Drawing.Color]::FromArgb(13, 17, 23))

$backgroundBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(22, 27, 34))
$borderPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(48, 54, 61), 2)
$accentBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(88, 166, 255))
$textBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(230, 237, 243))
$mutedBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(157, 167, 179))
$greenBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(63, 185, 80))
$chipBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(31, 111, 235))
$labelFont = New-Object System.Drawing.Font("Segoe UI Semibold", 18, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
$titleFont = New-Object System.Drawing.Font("Segoe UI Semibold", 64, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
$subtitleFont = New-Object System.Drawing.Font("Segoe UI", 27, [System.Drawing.FontStyle]::Regular, [System.Drawing.GraphicsUnit]::Pixel)
$chipFont = New-Object System.Drawing.Font("Segoe UI Semibold", 17, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
$centerFormat = New-Object System.Drawing.StringFormat
$centerFormat.Alignment = [System.Drawing.StringAlignment]::Center
$centerFormat.LineAlignment = [System.Drawing.StringAlignment]::Center

$graphics.FillRectangle($backgroundBrush, 80, 78, 1120, 484)
$graphics.DrawRectangle($borderPen, 80, 78, 1120, 484)

$graphics.FillEllipse($chipBrush, 570, 112, 140, 140)
$graphics.DrawString("{ }", $titleFont, [System.Drawing.Brushes]::White, [System.Drawing.RectangleF]::new(570, 130, 140, 90), $centerFormat)
$graphics.FillEllipse($greenBrush, 691, 222, 18, 18)

$graphics.DrawString("GITHUB README WIDGETS", $labelFont, $accentBrush, [System.Drawing.RectangleF]::new(140, 274, 1000, 32), $centerFormat)
$graphics.DrawString("Make READMEs interactive.", $titleFont, $textBrush, [System.Drawing.RectangleF]::new(110, 316, 1060, 82), $centerFormat)
$graphics.DrawString("API requests, charts, tabs, and sandboxed code previews.", $subtitleFont, $mutedBrush, [System.Drawing.RectangleF]::new(120, 397, 1040, 48), $centerFormat)

$chipLabels = @("API WIDGETS", "LIVE PREVIEWS", "CHROMIUM + FIREFOX")
$chipWidths = @(190, 210, 280)
$totalWidth = 190 + 210 + 280 + 24
$chipX = [int]((1280 - $totalWidth) / 2)
for ($index = 0; $index -lt $chipLabels.Length; $index++) {
    $width = $chipWidths[$index]
    $rectangle = New-Object System.Drawing.Rectangle($chipX, 482, $width, 40)
    $graphics.FillRectangle($backgroundBrush, $rectangle)
    $graphics.DrawRectangle($borderPen, $rectangle)
    $graphics.DrawString($chipLabels[$index], $chipFont, $mutedBrush, [System.Drawing.RectangleF]::new($chipX, 482, $width, 40), $centerFormat)
    $chipX += $width + 12
}

$bitmap.Save($outputPath, [System.Drawing.Imaging.ImageFormat]::Png)

$centerFormat.Dispose()
$labelFont.Dispose()
$titleFont.Dispose()
$subtitleFont.Dispose()
$chipFont.Dispose()
$borderPen.Dispose()
$backgroundBrush.Dispose()
$accentBrush.Dispose()
$textBrush.Dispose()
$mutedBrush.Dispose()
$greenBrush.Dispose()
$chipBrush.Dispose()
$graphics.Dispose()
$bitmap.Dispose()

Write-Output "Generated $outputPath"
