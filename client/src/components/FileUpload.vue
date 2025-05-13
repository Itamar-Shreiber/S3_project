<template>
    <div>
      <h1>Upload File to S3</h1>
      <input type="text" v-model="userId" placeholder="Enter your ID" />
      <input type="file" @change="handleFileChange" />
      <button @click="uploadFile">Upload</button>
  
      <hr />
  
      <button @click="fetchFilesById">Fetch Files By ID</button>
      <button @click="fetchAllFiles">Fetch All Files</button>
  
      <h2>Files for ID</h2>
      <ul v-if="filesById.length">
        <li v-for="file in filesById" :key="file.key">
          <a :href="file.url" target="_blank">{{ file.key }}</a>
        </li>
      </ul>
  
      <h2>All Files</h2>
      <ul v-if="allFiles.length">
        <li v-for="file in allFiles" :key="file.key">
          <a :href="file.url" target="_blank">{{ file.key }}</a>
        </li>
      </ul>
    </div>
  </template>
  
  <script>
  import axios from "axios";
  
  export default {
    data() {
      return {
        selectedFile: null,
        fileUrl: "",
        userId: "",
        filesById: [], // קבצים לפי ID
        allFiles: [], // כל הקבצים
      };
    },
    methods: {
      handleFileChange(event) {
        this.selectedFile = event.target.files[0];
      },
      async uploadFile() {
        if (!this.selectedFile || !this.userId) {
          alert("Please select a file and enter your ID.");
          return;
        }
  
        const formData = new FormData();
        formData.append("file", this.selectedFile);
        formData.append("userId", this.userId);
  
        try {
          const response = await axios.post("http://localhost:3000/upload", formData, {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          });
  
          if (response.data.url) {
            this.fileUrl = response.data.url;
          }
        } catch (error) {
          console.error("Error uploading file:", error);
        }
      },
      async fetchFilesById() {
        if (!this.userId) {
            alert("Please enter an ID to fetch files.");
            return;
        }

        try {
            const response = await axios.get(`http://localhost:3000/fileById/${this.userId}`);

            this.filesById = response.data;
        } catch (error) {
            console.error("Error fetching files:", error);
        }
        },
      async fetchAllFiles() {
        try {
          const response = await axios.get("http://localhost:3000/files");
          this.allFiles = response.data;
        } catch (error) {
          console.error("Error fetching files:", error);
        }
      },
    },
  };
  </script>
  