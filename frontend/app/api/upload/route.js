import { NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'
import { v4 as uuidv4 } from 'uuid'

// Route segment config for Next.js 14
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Allowed file types
const ALLOWED_TYPES = {
    pdf: ['.pdf'],
    image: ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg']
}

export async function POST(request) {
    try {
        const formData = await request.formData()
        const file = formData.get('file')
        const type = formData.get('type') || 'auto' // 'pdf', 'image', or 'auto'

        if (!file) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 })
        }

        const fileExtension = path.extname(file.name).toLowerCase()

        // Determine file type
        const isPdf = ALLOWED_TYPES.pdf.includes(fileExtension) || file.type === 'application/pdf'
        const isImage = ALLOWED_TYPES.image.includes(fileExtension) || file.type.startsWith('image/')

        if (!isPdf && !isImage) {
            console.error('Invalid file type:', file.name, file.type)
            return NextResponse.json({
                error: 'Only PDF and image files are allowed'
            }, { status: 400 })
        }

        // Validate file size (25MB for PDFs, 5MB for images)
        const maxSize = isPdf ? 25 * 1024 * 1024 : 5 * 1024 * 1024
        if (file.size > maxSize) {
            return NextResponse.json({
                error: `File size exceeds ${isPdf ? '25MB' : '5MB'} limit`
            }, { status: 400 })
        }

        // Create unique filename
        const uniqueFilename = `${uuidv4()}${fileExtension}`

        // Choose folder based on file type
        const folderName = isPdf ? 'enewspapers' : 'images'
        const uploadsDir = path.join(process.cwd(), 'public', 'uploads', folderName)

        try {
            await mkdir(uploadsDir, { recursive: true })
        } catch (err) {
            // Directory might already exist
        }

        // Save file
        const filePath = path.join(uploadsDir, uniqueFilename)
        const bytes = await file.arrayBuffer()
        const buffer = Buffer.from(bytes)
        await writeFile(filePath, buffer)

        // Return public URL
        const publicUrl = `/uploads/${folderName}/${uniqueFilename}`

        return NextResponse.json({
            success: true,
            url: publicUrl,
            filename: file.name,
            size: file.size,
            type: isPdf ? 'pdf' : 'image'
        })
    } catch (error) {
        console.error('Upload error:', error)
        return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
    }
}
