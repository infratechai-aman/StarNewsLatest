# Fix all API routes using direct db/auth imports to use lazy getDb/getAuth

$apiDir = "c:\Users\Aman Talukdar\Downloads\PMQ1-main\frontend\app\api"

Get-ChildItem -Path $apiDir -Recurse -Filter "route.js" | ForEach-Object {
    $content = Get-Content $_.FullName -Raw
    $changed = $false
    
    # Pattern 1: import { db, auth } from '@/lib/firebaseAdmin'  (with or without semicolon)
    if ($content -match "import \{ db, auth \} from '@/lib/firebaseAdmin'") {
        $content = $content -replace "import \{ db, auth \} from '@/lib/firebaseAdmin'[;]?", "import { getDb, getAuth } from '@/lib/firebaseAdmin';"
        $changed = $true
    }
    
    # Pattern 2: import { auth, db } from '@/lib/firebaseAdmin'
    if ($content -match "import \{ auth, db \} from '@/lib/firebaseAdmin'") {
        $content = $content -replace "import \{ auth, db \} from '@/lib/firebaseAdmin'[;]?", "import { getDb, getAuth } from '@/lib/firebaseAdmin';"
        $changed = $true
    }
    
    # Pattern 3: import { db } from '@/lib/firebaseAdmin'
    if ($content -match "import \{ db \} from '@/lib/firebaseAdmin'") {
        $content = $content -replace "import \{ db \} from '@/lib/firebaseAdmin'[;]?", "import { getDb } from '@/lib/firebaseAdmin';"
        $changed = $true
    }
    
    if ($changed) {
        # Now we need to add lazy initialization at the top of each handler function
        # We'll handle this manually per-file after the import fix
        Set-Content -Path $_.FullName -Value $content -NoNewline
        Write-Host "Fixed imports in: $($_.FullName)"
    }
}

Write-Host "`nDone fixing imports!"
