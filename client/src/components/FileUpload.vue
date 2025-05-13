<template>
  <div class="container">
    <h1 class="title">העלאת קובץ ל-S3</h1>

    <input type="text" v-model="userId" placeholder="הכנס תעודת זהות" class="input" />
    <input type="file" @change="handleFileChange" class="input" />
    <button @click="uploadFile" class="btn">העלה קובץ</button>

    <hr />

    <button @click="fetchFilesById" class="btn">הצג קבצים לפי תעודת זהות</button>
    <button @click="fetchAllFiles" class="btn">הצג את כל הקבצים</button>

    <!-- טבלת קבצים לפי ת"ז -->
    <div v-if="filesById.length" class="table-wrapper">
      <h2 class="section-title">קבצים לפי תעודת זהות</h2>
      <table class="file-table">
        <thead>
          <tr>
            <th>ת"ז</th>
            <th>UUID</th>
            <th>סוג קובץ</th>
            <th>קישור</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="file in filesById" :key="file.key">
            <td>{{ parseFileKey(file.key).id }}</td>
            <td>{{ parseFileKey(file.key).uuid }}</td>
            <td>{{ parseFileKey(file.key).type }}</td>
            <td><a :href="file.url" target="_blank">הורדה</a></td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- טבלת כל הקבצים -->
    <div v-if="allFiles.length" class="table-wrapper">
      <h2 class="section-title">כל הקבצים</h2>
      <table class="file-table">
        <thead>
          <tr>
            <th>ת"ז</th>
            <th>UUID</th>
            <th>סוג קובץ</th>
            <th>קישור</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="file in allFiles" :key="file.key">
            <td>{{ parseFileKey(file.key).id }}</td>
            <td>{{ parseFileKey(file.key).uuid }}</td>
            <td>{{ parseFileKey(file.key).type }}</td>
            <td><a :href="file.url" target="_blank">הורדה</a></td>
          </tr>
        </tbody>
      </table>
    </div>
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
      filesById: [],
      allFiles: [],
    };
  },
  methods: {
    handleFileChange(event) {
      this.selectedFile = event.target.files[0];
    },
    async uploadFile() {
      if (!this.selectedFile || !this.userId) {
        alert("אנא בחר קובץ והכנס תעודת זהות.");
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
        console.error("שגיאה בהעלאת קובץ:", error);
      }
    },
    async fetchFilesById() {
      if (!this.userId) {
        alert("אנא הכנס תעודת זהות.");
        return;
      }

      try {
        const response = await axios.get(`http://localhost:3000/fileById/${this.userId}`);
        console.log("קבצים לפי תעודת זהות:", response.data.fetchFilesById);
        this.filesById = response.data.files;
      } catch (error) {
        console.error("שגיאה בקבלת קבצים לפי תעודת זהות:", error);
      }
    },
    async fetchAllFiles() {
      try {
        const response = await axios.get("http://localhost:3000/files");
        console.log("כל הקבצים:", response.data);
        this.allFiles = response.data;
      } catch (error) {
        console.error("שגיאה בקבלת כל הקבצים:", error);
      }
    },
    parseFileKey(key) {
  if (!key || typeof key !== 'string') {
    return { id: '', uuid: '', type: '' };
  }

  const [id, filePart] = key.split("/");
  if (!filePart) {
    return { id, uuid: '', type: '' };
  }

  const [uuid, ...rest] = filePart.split(".");
  const type = rest.join(".");
  return { id, uuid, type };
},
  },
};
</script>

<style scoped src="./FileUpload.css"></style>
