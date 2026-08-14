'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Trash2, Plus, Loader2, Image as ImageIcon, Video as VideoIcon, Pencil, X } from 'lucide-react';

export default function AdminShortsPanel({ toast }) {
    const [shorts, setShorts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Form State
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingShort, setEditingShort] = useState(null); // null = create, object = edit
    const [mediaType, setMediaType] = useState('video'); // 'video' or 'image'
    const [videoUrl, setVideoUrl] = useState('');
    const [title, setTitle] = useState('');
    const [caption, setCaption] = useState('');
    const [isActive, setIsActive] = useState(true);

    // File upload
    const [selectedFile, setSelectedFile] = useState(null);
    const [uploadingImage, setUploadingImage] = useState(false);
    const fileInputRef = useRef(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch('/api/admin/shorts', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.shorts) setShorts(data.shorts);
        } catch (error) {
            console.error('Failed to fetch data:', error);
            toast({ title: 'Error', description: 'Failed to load shorts data', variant: 'destructive' });
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setEditingShort(null);
        setMediaType('video');
        setVideoUrl('');
        setTitle('');
        setCaption('');
        setIsActive(true);
        setSelectedFile(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
        setIsFormOpen(false);
    };

    const openEditForm = (short) => {
        setEditingShort(short);
        setMediaType(short.mediaType || 'video');
        setVideoUrl(short.mediaUrl || '');
        setTitle(short.title || '');
        setCaption(short.caption || '');
        setIsActive(short.active !== false);
        setSelectedFile(null);
        setIsFormOpen(true);
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // 2MB Limit
        if (file.size > 2 * 1024 * 1024) {
            toast({ title: 'File Too Large', description: 'Image must be under 2MB', variant: 'destructive' });
            e.target.value = '';
            return;
        }

        if (!file.type.startsWith('image/')) {
            toast({ title: 'Invalid File', description: 'Please select an image file', variant: 'destructive' });
            e.target.value = '';
            return;
        }

        setSelectedFile(file);
    };

    const uploadImage = async () => {
        if (!selectedFile) return null;

        const formData = new FormData();
        formData.append('file', selectedFile);

        try {
            const token = localStorage.getItem('token');
            const res = await fetch('/api/upload-large', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData
            });
            const data = await res.json();
            if (!res.ok) {
                // If Vercel, fallback to /api/upload (Firestore base64 route)
                if (res.status === 501) {
                    const res2 = await fetch('/api/upload', {
                        method: 'POST',
                        headers: { 'Authorization': `Bearer ${token}` },
                        body: formData
                    });
                    const data2 = await res2.json();
                    if (!res2.ok) throw new Error(data2.error || 'Upload failed');
                    return data2.url;
                }
                throw new Error(data.error || 'Upload failed');
            }
            return data.url;
        } catch (error) {
            throw error;
        }
    };

    const handleSubmitShort = async () => {
        if (mediaType === 'video' && !videoUrl) {
            toast({ title: 'Validation Error', description: 'Video URL is required', variant: 'destructive' });
            return;
        }
        if (mediaType === 'image' && !selectedFile && !editingShort?.mediaUrl) {
            toast({ title: 'Validation Error', description: 'Please select an image to upload', variant: 'destructive' });
            return;
        }

        setSaving(true);
        try {
            let finalMediaUrl = videoUrl;

            // Upload image if a new file was selected
            if (mediaType === 'image' && selectedFile) {
                setUploadingImage(true);
                finalMediaUrl = await uploadImage();
                setUploadingImage(false);
            } else if (mediaType === 'image' && editingShort?.mediaUrl) {
                // Keep existing image URL if no new file selected
                finalMediaUrl = editingShort.mediaUrl;
            }

            const token = localStorage.getItem('token');
            const isEditing = !!editingShort;
            const url = isEditing ? `/api/admin/shorts/${editingShort.id}` : '/api/admin/shorts';
            const method = isEditing ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    mediaType,
                    mediaUrl: finalMediaUrl,
                    title,
                    caption,
                    active: isActive
                })
            });

            if (res.ok) {
                toast({ title: 'Success', description: isEditing ? 'Short updated successfully' : 'Short published successfully' });
                resetForm();
                fetchData();
            } else {
                const data = await res.json();
                toast({ title: 'Error', description: data.error || 'Failed to save short', variant: 'destructive' });
            }
        } catch (error) {
            console.error(error);
            toast({ title: 'Error', description: 'Server error while saving short', variant: 'destructive' });
            setUploadingImage(false);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to delete this short?')) return;
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`/api/admin/shorts/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                toast({ title: 'Success', description: 'Short deleted' });
                setShorts(shorts.filter(s => s.id !== id));
            }
        } catch (error) {
            toast({ title: 'Error', description: 'Failed to delete short', variant: 'destructive' });
        }
    };

    const handleToggle = async (id, currentStatus) => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`/api/admin/shorts/${id}/toggle`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ active: !currentStatus })
            });
            if (res.ok) {
                setShorts(shorts.map(s => s.id === id ? { ...s, active: !currentStatus } : s));
            } else {
                toast({ title: 'Error', description: 'Failed to toggle status', variant: 'destructive' });
            }
        } catch (error) {
            toast({ title: 'Error', description: 'Failed to toggle status', variant: 'destructive' });
        }
    };

    if (loading) {
        return <div className="p-8 flex justify-center"><Loader2 className="w-8 h-8 animate-spin" /></div>;
    }

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">Manage Shorts & Reels</h2>
                <Button onClick={() => { resetForm(); setIsFormOpen(!isFormOpen); }}>
                    {isFormOpen ? <><X className="w-4 h-4 mr-2" /> Cancel</> : <><Plus className="w-4 h-4 mr-2" /> Create Reel</>}
                </Button>
            </div>

            {isFormOpen && (
                <Card className="border-primary bg-primary/5">
                    <CardHeader>
                        <CardTitle>{editingShort ? 'Edit Reel / Short' : 'Create New Reel / Short'}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">

                        <div>
                            <label className="text-sm font-medium">Media Type</label>
                            <Select value={mediaType} onValueChange={setMediaType} disabled={!!editingShort}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select type..." />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="video"><div className="flex items-center"><VideoIcon className="w-4 h-4 mr-2" /> Video Link (YouTube/MP4)</div></SelectItem>
                                    <SelectItem value="image"><div className="flex items-center"><ImageIcon className="w-4 h-4 mr-2" /> Static Image Upload</div></SelectItem>
                                </SelectContent>
                            </Select>
                            {editingShort && <p className="text-xs text-muted-foreground mt-1">Media type cannot be changed when editing.</p>}
                        </div>

                        {mediaType === 'video' ? (
                            <div>
                                <label className="text-sm font-medium">Video URL (YouTube Shorts or external MP4)</label>
                                <Input
                                    placeholder="https://youtube.com/shorts/..."
                                    value={videoUrl}
                                    onChange={(e) => setVideoUrl(e.target.value)}
                                />
                            </div>
                        ) : (
                            <div>
                                <label className="text-sm font-medium">
                                    {editingShort ? 'Replace Image (Max 2MB) — leave empty to keep current' : 'Upload Image (Max 2MB)'}
                                </label>
                                {editingShort?.mediaUrl && !selectedFile && (
                                    <div className="mb-2">
                                        <img src={editingShort.mediaUrl} alt="Current" className="h-20 w-auto rounded object-cover border" />
                                        <p className="text-xs text-muted-foreground mt-1">Current image — select a new file to replace it</p>
                                    </div>
                                )}
                                <Input
                                    type="file"
                                    accept="image/*"
                                    ref={fileInputRef}
                                    onChange={handleFileChange}
                                    className="cursor-pointer"
                                />
                                {selectedFile && <p className="text-xs text-green-600 mt-1">Ready: {selectedFile.name}</p>}
                            </div>
                        )}

                        <div>
                            <label className="text-sm font-medium">Title (Optional)</label>
                            <Input
                                placeholder="Catchy title..."
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                maxLength={200}
                            />
                        </div>

                        <div>
                            <label className="text-sm font-medium">Caption (Optional)</label>
                            <Textarea
                                placeholder="Write a description or caption..."
                                value={caption}
                                onChange={(e) => setCaption(e.target.value)}
                                className="h-24"
                                maxLength={2000}
                            />
                        </div>

                        <div className="flex items-center gap-2">
                            <Switch checked={isActive} onCheckedChange={setIsActive} />
                            <span className="text-sm font-medium">Active (Visible to users)</span>
                        </div>

                        <div className="flex gap-2">
                            <Button onClick={handleSubmitShort} disabled={saving || uploadingImage}>
                                {(saving || uploadingImage) && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                {uploadingImage ? 'Uploading Image...' : saving ? 'Saving...' : editingShort ? 'Save Changes' : 'Publish Reel'}
                            </Button>
                            {editingShort && (
                                <Button variant="outline" onClick={resetForm}>
                                    Cancel Edit
                                </Button>
                            )}
                        </div>
                    </CardContent>
                </Card>
            )}

            <Card>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Type</TableHead>
                                <TableHead>Title</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {shorts.map(short => (
                                <TableRow key={short.id}>
                                    <TableCell>
                                        {short.mediaType === 'image'
                                            ? <ImageIcon className="w-4 h-4 text-blue-500" />
                                            : <VideoIcon className="w-4 h-4 text-red-500" />
                                        }
                                    </TableCell>
                                    <TableCell className="font-medium max-w-xs truncate">
                                        {short.title || '(No Title)'}
                                    </TableCell>
                                    <TableCell>
                                        <Switch
                                            checked={short.active}
                                            onCheckedChange={() => handleToggle(short.id, short.active)}
                                        />
                                    </TableCell>
                                    <TableCell className="text-right flex justify-end gap-1">
                                        <Button variant="ghost" size="sm" onClick={() => openEditForm(short)} className="text-blue-500">
                                            <Pencil className="w-4 h-4" />
                                        </Button>
                                        <Button variant="ghost" size="sm" onClick={() => handleDelete(short.id)} className="text-red-500">
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {shorts.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                                        No reels created yet.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
