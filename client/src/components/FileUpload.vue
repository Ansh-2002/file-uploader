<template>
  <div class="upload-container">
    <h1>Document Upload</h1>
    <input type="file" accept="application/pdf" @change="onFileChange" aria-label="File Upload" />
    <button :disabled="!file || uploading" @click="uploadFile">
      {{ uploading ? 'Uploading...' : 'Upload' }}
    </button>
    <progress v-if="progress >= 0" :value="progress" max="100"></progress> <!-- Loading bar -->
    <p v-if="progress >= 0">Upload Progress: {{ progress }}%</p>
    <p v-if="message" :class="{ error: isError }">{{ message }}</p>
  </div>
</template>


<script>
import axios from 'axios';

export default {
  data() {
    return {
      file: null,
      uploading: false,
      progress: -1,
      message: '',
      isError: false, // Flag to style error messages
    };
  },
  methods: {
    onFileChange(event) {
      this.file = event.target.files[0];
      this.progress = -1; // Reset progress
      this.message = ''; // Clear previous messages
      this.isError = false;

      // Validate file size
      if (this.file.size > 50 * 1024 * 1024) {
        this.message = 'File size exceeds 50MB. Please upload a smaller file.';
        this.file = null; // Reset file
        this.isError = true;
        return;
      }

      // Validate file type
      if (this.file.type !== 'application/pdf') {
        this.message = 'Invalid file type. Please upload a PDF file.';
        this.file = null; // Reset file
        this.isError = true;
      }
    },
    async uploadFile() {
      if (!this.file) return;

      this.uploading = true;
      this.progress = 0;
      this.message = '';
      this.isError = false;

      const formData = new FormData();
      formData.append('file', this.file);

      try {
        const response = await axios.post('http://localhost:3000/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
          onUploadProgress: (progressEvent) => {
            this.progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          },
        });

        this.message = response.data.message || 'File uploaded successfully!';
      } catch (error) {
        this.message = error.response?.data?.message || 'File upload failed. Please try again.';
        this.isError = true;
      } finally {
        this.uploading = false;
        this.file = null; // Reset file after upload
      }
    },
  },
};
</script>

<style>
.upload-container {
  max-width: 500px;
  margin: auto;
  text-align: center;
}

button {
  margin-top: 10px;
  padding: 10px 20px;
  font-size: 16px;
}

progress {
  width: 100%;
  margin-top: 10px;
}

p {
  margin-top: 10px;
}

.error {
  color: red;
  font-weight: bold;
}
</style>