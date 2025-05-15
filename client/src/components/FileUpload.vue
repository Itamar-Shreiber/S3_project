<template>
  <div class="container">
    <h1 class="title">העלאת קובץ ל-S3</h1>

    <input type="text" v-model="userId" placeholder="הכנס תעודת זהות" class="input" />
    <input type="file" @change="handleFileChange" class="input" />
    <button @click="uploadFile" class="btn">העלה קובץ</button>

    <hr />

    <button @click="fetchFilesById" class="btn">הצג קבצים לפי תעודת זהות</button>
    <button @click="fetchAllFiles" class="btn">הצג את כל הקבצים</button>
    <button @click="clearTables" class="btn">נקה</button>

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
            <td><button @click="deleteFile(file.key)" class="btn btn-danger">🗑 מחק</button></td>
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
            <td><button @click="deleteFile(file.key)" class="btn btn-danger">🗑 מחק</button></td>
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
      showFilesById: false, // מצב האם להציג את קבצים לפי ת"ז
      showAllFiles: false,  // מצב האם להציג את כל הקבצים
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

    console.log("תגובה מהשרת:", response.data);

    if (response.data.url && response.data.fileKey) {
      this.fileUrl = response.data.url;

      const { id, uuid } = this.parseFileKey(response.data.fileKey);
      alert(`הקובץ הועלה בהצלחה!\nתעודת זהות: ${id}\nמזהה ייחודי (UUID): ${uuid}`);
    }
  } catch (error) {
    console.error("שגיאה בהעלאת קובץ:", error);
  }
},

    async fetchFilesById() {
  // ניקוי נתונים ודגלים
  this.clearTables();

  if (!this.userId) {
    alert("אנא הכנס תעודת זהות.");
    return;
  }

  try {
    const response = await axios.get(`http://localhost:3000/fileById/${this.userId}`);
    console.log("קבצים לפי תעודת זהות:", response.data.fetchFilesById);
    this.filesById = response.data.files;
    this.showFilesById = true; // הצגת טבלה
  } catch (error) {
    console.error("שגיאה בקבלת קבצים לפי תעודת זהות:", error);
  }
},

async fetchAllFiles() {
  // ניקוי נתונים ודגלים
  this.clearTables();

  try {
    const response = await axios.get("http://localhost:3000/files");
    console.log("כל הקבצים:", response.data);
    this.allFiles = response.data;
    this.showAllFiles = true; // הצגת טבלה
  } catch (error) {
    console.error("שגיאה בקבלת כל הקבצים:", error);
  }
},
async deleteFile(fileKey) {
  if (!confirm("האם אתה בטוח שברצונך למחוק את הקובץ הזה?")) {
    return;
  }

  try {
    await axios.delete(`http://localhost:3000/delete-file/${encodeURIComponent(fileKey)}`);
      alert("הקובץ נמחק בהצלחה.");

      // רענון הטבלאות אחרי מחיקה
      if (this.userId) {
        await this.fetchFilesById();
      } else {
        await this.fetchAllFiles();
      }
    } catch (error) {
      console.error("שגיאה במחיקת הקובץ:", error);
    }
},

    clearTables() {
      this.filesById = [];
      this.allFiles = [];
      this.showFilesById = false;
      this.showAllFiles = false;
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
