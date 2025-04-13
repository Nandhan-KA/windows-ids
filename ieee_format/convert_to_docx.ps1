# PowerShell script to convert text to DOCX with IEEE formatting
$textFilePath = Join-Path $PSScriptRoot "evaluation_results_ieee.txt"
$docxFilePath = Join-Path $PSScriptRoot "evaluation_results_ieee.docx"

# Create Word application object
$Word = New-Object -ComObject Word.Application
$Word.Visible = $false

# Create a new document
$Document = $Word.Documents.Add()

# Set up IEEE formatting
$Document.PageSetup.TopMargin = 72 # 1 inch in points
$Document.PageSetup.BottomMargin = 72
$Document.PageSetup.LeftMargin = 54 # 0.75 inch in points
$Document.PageSetup.RightMargin = 54
$Document.PageSetup.Orientation = 1 # Portrait orientation

# Set up two columns
$Document.PageSetup.TextColumns.SetCount(2)

# Set appropriate IEEE font (Times New Roman)
$Document.Content.Font.Name = "Times New Roman"
$Document.Content.Font.Size = 10

# Import text
$Document.Content.Text = Get-Content -Path $textFilePath -Raw

# Format the title
$Document.Paragraphs[1].Range.Font.Size = 14
$Document.Paragraphs[1].Range.Font.Bold = $true
$Document.Paragraphs[1].Alignment = 1 # Center alignment
$Document.Paragraphs[2].Range.Font.Size = 14
$Document.Paragraphs[2].Range.Font.Bold = $true
$Document.Paragraphs[2].Alignment = 1 # Center alignment

# Format the abstract and index terms
$Document.Paragraphs[4].Range.Font.Italic = $true
$Document.Paragraphs[6].Range.Font.Italic = $true

# Constants for Word
$wdFormatDocumentDefault = 16

# Save the document (using a simpler method)
$Document.SaveAs($docxFilePath)

# Close Word
$Document.Close()
$Word.Quit()

# Release COM objects
[System.Runtime.Interopservices.Marshal]::ReleaseComObject($Document) | Out-Null
[System.Runtime.Interopservices.Marshal]::ReleaseComObject($Word) | Out-Null
[System.GC]::Collect()
[System.GC]::WaitForPendingFinalizers()

Write-Output "Conversion complete. DOCX file saved at: $docxFilePath" 