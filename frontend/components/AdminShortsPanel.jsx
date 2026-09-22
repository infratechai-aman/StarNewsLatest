'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Trash2, Plus, Loader2, Image as ImageIcon, Video as VideoIcon, Pencil, X, RefreshCw, Eye } from 'lucide-react';
import { admin, authenticatedFetch } from '@/lib/api';

export default function AdminShortsPanel({ toast, setCurrentView }) {
    const [shorts, setShorts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
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

    const fetchData = async (isManual = false) => {
        if (isManual) setRefreshing(true);
        else setLoading(true);
        try {
            const data = await admin.getShorts(isManual);
            if (data && data.shorts) setShorts(data.shorts);
            if (isManual && toast) {
                toast({ title: 'Refreshed', description: 'Reels and shorts list updated from server.' });
            }
        } catch (error) {
            console.error('Failed to fetch data:', error);
            if (toast) toast({ title: 'Error', description: error.message || 'Failed to load shorts data', variant: 'destructive' });
        } finally {
            setLoading(false);
            setRefreshing(false);
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
            const res = await authenticatedFetch('/api/upload-large', {
                method: 'POST',
                body: formData
            });
            const data = await res.json();
            if (!res.ok) {
                // If Vercel, fallback to /api/upload (Firestore base64 route)
                if (res.status === 501) {
                    const res2 = await authenticatedFetch('/api/upload', {
                        method: 'POST',
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

            const isEditing = !!editingShort;
            const payload = {
                mediaType,
                mediaUrl: finalMediaUrl,
                title,
                caption,
                active: isActive
            };

            if (isEditing) {
                await admin.updateShort(editingShort.id, payload);
                toast({ title: 'Success', description: 'Short updated successfully' });
            } else {
                await admin.createShort(payload);
                toast({ title: 'Success', description: 'Short published successfully' });
            }

            resetForm();
            fetchData();
        } catch (error) {
            console.error(error);
            toast({ title: 'Error', description: error.message || 'Failed to save short', variant: 'destructive' });
            setUploadingImage(false);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to delete this short?')) return;
        try {
            await admin.deleteShort(id);
            toast({ title: 'Success', description: 'Short deleted' });
            setShorts(shorts.filter(s => s.id !== id));
        } catch (error) {
            toast({ title: 'Error', description: error.message || 'Failed to delete short', variant: 'destructive' });
        }
    };

    const handleToggle = async (id, currentStatus) => {
        try {
            await admin.toggleShort(id, !currentStatus);
            setShorts(shorts.map(s => s.id === id ? { ...s, active: !currentStatus } : s));
        } catch (error) {
            toast({ title: 'Error', description: error.message || 'Failed to toggle status', variant: 'destructive' });
        }
    };

    if (loading) {
        return <div className="p-8 flex justify-center"><Loader2 className="w-8 h-8 animate-spin" /></div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">Manage Shorts & Reels</h2>
                    <p className="text-sm text-gray-500 mt-1">Add and organize your short-form video content</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                            if (setCurrentView) setCurrentView('shorts');
                            else window.open('/?view=shorts', '_blank');
                        }}
                        className="rounded-xl border-red-200 bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 h-11 px-4 font-semibold shadow-sm"
                        title="View Public Shorts Feed"
                    >
                        <Eye className="w-4 h-4 mr-2" />
                        Public Feed
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => fetchData(true)}
                        disabled={refreshing || loading}
                        className="rounded-xl border-gray-200 text-gray-700 hover:bg-gray-50 h-11 px-4 font-medium"
                    >
                        <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin text-blue-600' : ''}`} />
                        Refresh
                    </Button>
                    <Button 
                        onClick={() => { resetForm(); setIsFormOpen(!isFormOpen); }}
                        className={`rounded-xl shadow-sm h-11 px-5 font-semibold transition-all ${
                            isFormOpen 
                                ? 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200' 
                                : 'bg-blue-600 text-white hover:bg-blue-700'
                        }`}
                    >
                        {isFormOpen ? <><X className="w-4 h-4 mr-2" /> Cancel</> : <><Plus className="w-4 h-4 mr-2" /> Create Reel</>}
                    </Button>
                </div>
            </div>

            {isFormOpen && (
                <Card className="border-0 shadow-sm rounded-2xl overflow-hidden bg-white ring-1 ring-gray-100">
                    <CardHeader className="bg-gray-50/50 border-b border-gray-100 pb-5">
                        <CardTitle className="text-lg font-bold text-gray-800 flex items-center gap-2">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${editingShort ? 'bg-amber-100 text-amber-600' : 'bg-blue-100 text-blue-600'}`}>
                                {editingShort ? <Pencil className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                            </div>
                            {editingShort ? 'Edit Reel / Short' : 'Create New Reel / Short'}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 md:p-8 space-y-6">

                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-gray-700">Media Type</label>
                            <Select value={mediaType} onValueChange={setMediaType} disabled={!!editingShort}>
                                <SelectTrigger className="w-full h-12 bg-gray-50/50 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500">
                                    <SelectValue placeholder="Select type..." />
                                </SelectTrigger>
                                <SelectContent className="rounded-xl border-gray-100 shadow-lg">
                                    <SelectItem value="video" className="rounded-lg my-1"><div className="flex items-center"><VideoIcon className="w-4 h-4 mr-2 text-red-500" /> Video Link (YouTube/MP4)</div></SelectItem>
                                    <SelectItem value="image" className="rounded-lg my-1"><div className="flex items-center"><ImageIcon className="w-4 h-4 mr-2 text-blue-500" /> Static Image Upload</div></SelectItem>
                                </SelectContent>
                            </Select>
                            {editingShort && <p className="text-xs text-amber-600 font-medium ml-1">Media type cannot be changed when editing.</p>}
                        </div>

                        {mediaType === 'video' ? (
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-gray-700">Video URL</label>
                                <Input
                                    placeholder="https://youtube.com/shorts/..."
                                    value={videoUrl}
                                    onChange={(e) => setVideoUrl(e.target.value)}
                                    className="h-12 bg-gray-50/50 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500"
                                />
                                <p className="text-xs text-gray-500 font-medium ml-1">Supports YouTube Shorts or external MP4 links</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                <label className="text-sm font-semibold text-gray-700">
                                    {editingShort ? 'Replace Image' : 'Upload Image'}
                                </label>
                                {editingShort?.mediaUrl && !selectedFile && (
                                    <div className="mb-3 p-3 bg-gray-50 rounded-xl border border-gray-100 inline-block">
                                        <img src={editingShort.mediaUrl} alt="Current" className="h-24 w-auto rounded-lg object-cover shadow-sm" />
                                        <p className="text-xs text-gray-500 font-medium mt-2">Current image</p>
                                    </div>
                                )}
                                <div className="flex items-center gap-3">
                                    <label className="cursor-pointer">
                                        <Input
                                            type="file"
                                            accept="image/*"
                                            ref={fileInputRef}
                                            onChange={handleFileChange}
                                            className="hidden"
                                        />
                                        <span className="inline-flex items-center h-12 px-6 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 hover:text-blue-600 transition-colors shadow-sm font-medium">
                                            <ImageIcon className="h-4 w-4 mr-2" /> 
                                            {selectedFile ? 'Change File' : 'Select Image'}
                                        </span>
                                    </label>
                                    {selectedFile && <span className="text-sm text-green-600 font-semibold bg-green-50 px-3 py-1.5 rounded-lg border border-green-100 truncate max-w-xs">{selectedFile.name}</span>}
                                </div>
                                <p className="text-xs text-gray-500 font-medium ml-1">Maximum file size: 2MB</p>
                            </div>
                        )}

                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-gray-700">Title (Optional)</label>
                            <Input
                                placeholder="Catchy title..."
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                maxLength={200}
                                className="h-12 bg-gray-50/50 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-gray-700">Caption (Optional)</label>
                            <Textarea
                                placeholder="Write a description or caption..."
                                value={caption}
                                onChange={(e) => setCaption(e.target.value)}
                                className="h-28 bg-gray-50/50 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 resize-none p-4"
                                maxLength={2000}
                            />
                        </div>

                        <div className="flex items-center gap-3 p-4 bg-gray-50/80 rounded-xl border border-gray-100 w-fit">
                            <Switch checked={isActive} onCheckedChange={setIsActive} className="data-[state=checked]:bg-green-500" />
                            <span className="text-sm font-semibold text-gray-700">Active (Visible to users)</span>
                        </div>

                        <div className="flex gap-3 pt-4 border-t border-gray-100">
                            <Button 
                                onClick={handleSubmitShort} 
                                disabled={saving || uploadingImage}
                                className="bg-blue-600 hover:bg-blue-700 text-white h-12 px-8 rounded-xl shadow-sm text-base flex-1 sm:flex-none"
                            >
                                {(saving || uploadingImage) && <Loader2 className="w-5 h-5 mr-2 animate-spin" />}
                                {uploadingImage ? 'Uploading Image...' : saving ? 'Saving...' : editingShort ? 'Save Changes' : 'Publish Reel'}
                            </Button>
                            {editingShort && (
                                <Button 
                                    variant="outline" 
                                    onClick={resetForm}
                                    className="h-12 px-8 rounded-xl border-gray-200 hover:bg-gray-50 text-gray-700 font-medium flex-1 sm:flex-none"
                                >
                                    Cancel Edit
                                </Button>
                            )}
                        </div>
                    </CardContent>
                </Card>
            )}

            <Card className="border-0 shadow-sm rounded-2xl overflow-hidden bg-white">
                <CardContent className="p-0">
                    <Table>
                        <TableHeader className="bg-gray-50/80">
                            <TableRow className="border-gray-100">
                                <TableHead className="font-semibold text-gray-500 py-4 px-6 w-[100px]">Type</TableHead>
                                <TableHead className="font-semibold text-gray-500 py-4">Title</TableHead>
                                <TableHead className="font-semibold text-gray-500 py-4 w-[150px]">Status</TableHead>
                                <TableHead className="font-semibold text-gray-500 py-4 px-6 text-right w-[150px]">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {shorts.map(short => (
                                <TableRow key={short.id} className="border-gray-100 hover:bg-gray-50/50 transition-colors group">
                                    <TableCell className="px-6 py-4">
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-sm ${
                                            short.mediaType === 'image' ? 'bg-blue-50' : 'bg-red-50'
                                        }`}>
                                            {short.mediaType === 'image'
                                                ? <ImageIcon className="w-5 h-5 text-blue-500" />
                                                : <VideoIcon className="w-5 h-5 text-red-500" />
                                            }
                                        </div>
                                    </TableCell>
                                    <TableCell className="py-4">
                                        <div className="font-bold text-gray-800 line-clamp-1 group-hover:text-blue-600 transition-colors">
                                            {short.title || <span className="text-gray-400 font-medium italic">(No Title)</span>}
                                        </div>
                                        {short.caption && (
                                            <div className="text-xs text-gray-500 mt-1 line-clamp-1 max-w-md">{short.caption}</div>
                                        )}
                                    </TableCell>
                                    <TableCell className="py-4">
                                        <div className="flex items-center gap-2">
                                            <Switch
                                                checked={short.active}
                                                onCheckedChange={() => handleToggle(short.id, short.active)}
                                                className="data-[state=checked]:bg-green-500 shadow-sm"
                                            />
                                            <span className={`text-xs font-bold px-2 py-1 rounded-md ${short.active ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                                                {short.active ? 'ACTIVE' : 'HIDDEN'}
                                            </span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right px-6 py-4">
                                        <div className="flex justify-end gap-2">
                                            <Button 
                                                variant="outline" 
                                                size="sm" 
                                                onClick={() => openEditForm(short)} 
                                                className="h-9 w-9 p-0 rounded-xl border-blue-200 text-blue-600 hover:bg-blue-50 shadow-sm"
                                                title="Edit Short"
                                            >
                                                <Pencil className="w-4 h-4" />
                                            </Button>
                                            <Button 
                                                variant="outline" 
                                                size="sm" 
                                                onClick={() => handleDelete(short.id)} 
                                                className="h-9 w-9 p-0 rounded-xl border-red-200 text-red-600 hover:bg-red-50 shadow-sm"
                                                title="Delete Short"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {shorts.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center py-16 bg-gray-50/30">
                                        <div className="w-16 h-16 bg-gray-100 text-gray-300 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <VideoIcon className="h-8 w-8" />
                                        </div>
                                        <p className="font-medium text-gray-500 text-lg">No reels created yet.</p>
                                        <p className="text-sm text-gray-400 mt-1">Click "Create Reel" to add your first short video or image.</p>
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
