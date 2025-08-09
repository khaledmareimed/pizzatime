# ImgBB Image Upload Setup

This project uses ImgBB as the image hosting service for products and categories. Follow these steps to set up ImgBB integration:

## 1. Get ImgBB API Key

1. Go to [ImgBB API](https://api.imgbb.com/)
2. Sign up or log in to your account
3. Navigate to "API" section
4. Get your API key

## 2. Configure Environment Variables

Add your ImgBB API key to your environment variables:

```bash
# In your .env.local file
NEXT_PUBLIC_IMGBB_API_KEY=your-imgbb-api-key-here
```

## 3. Features

### Product Images
- Upload multiple images per product (up to 8 images)
- Drag and drop interface
- Progress indicator during upload
- Image validation (JPG, PNG, WebP, GIF)
- Maximum file size: 5MB per image
- Automatic thumbnail generation

### Category Images
- Single image per category
- Same upload interface and validation
- Used for category display and organization

## 4. Image Upload Process

1. **Client Side**: Files are selected via drag-drop or file picker
2. **Validation**: File type and size validation on client
3. **Upload**: Images are uploaded to ImgBB servers
4. **Storage**: ImgBB URLs are saved in MongoDB
5. **Display**: Images are loaded from ImgBB CDN

## 5. Benefits of Using ImgBB

- **Free Service**: No cost for image hosting
- **CDN**: Fast image delivery worldwide
- **Reliability**: Professional image hosting
- **Bandwidth**: No bandwidth limits
- **Storage**: Permanent image storage
- **API**: RESTful API with good documentation

## 6. Alternative Services

If you prefer other image hosting services, you can easily modify the `funcs/imgbb.ts` file to use:

- **Cloudinary**
- **Amazon S3**
- **Google Cloud Storage**
- **Firebase Storage**
- **Supabase Storage**

## 7. Troubleshooting

### Common Issues:

1. **"ImgBB API key not configured"**
   - Ensure `NEXT_PUBLIC_IMGBB_API_KEY` is set in your environment

2. **"Upload failed"**
   - Check your internet connection
   - Verify the API key is correct
   - Ensure file is under 5MB and valid format

3. **"File too large"**
   - Compress images before upload
   - Current limit is 5MB per image

4. **"Invalid file type"**
   - Only JPG, PNG, WebP, and GIF are supported
   - Convert other formats before upload

## 8. Security Considerations

- API key is exposed on client side (NEXT_PUBLIC_*)
- This is normal for ImgBB integration
- API key only allows uploads to your account
- Consider rate limiting for production use
- Validate uploads on server side as well

## 9. Production Deployment

For production deployment:

1. Set environment variable on your hosting platform
2. Consider implementing additional validation
3. Monitor API usage and quotas
4. Set up error logging and monitoring
5. Consider adding image optimization
