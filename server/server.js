const express = require("express");
const cors = require("cors");
const fs = require("fs");
const { IncomingForm } = require("formidable");
const { Upload } = require("@aws-sdk/lib-storage");
const {
  ListObjectsV2Command,
  GetObjectCommand,
  DeleteObjectCommand,
} = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const { v4: uuidv4 } = require("uuid");
const { s3 } = require("./s3"); // הגדרת לקוח S3 מותאם אישית שלך

const app = express();
const port = 3000;

app.use(cors({ origin: "http://localhost:8080" }));

const bucketName = "atd-tester-bucket";


const insertObjectS3 = async ({ file, bucketName, idNumber, fileId = uuidv4() }) => {
  const uploadedFile = Array.isArray(file) ? file[0] : file;

  if (!uploadedFile || !uploadedFile.originalFilename) {
    throw new Error("File or file name is missing");
  }

  const fileExtension = uploadedFile.originalFilename.split(".").at(-1);
  const key = `${idNumber}/${fileId}.${fileExtension}`;

  const uploadParams = {
    Bucket: bucketName,
    Key: key,
    Body: fs.createReadStream(uploadedFile._writeStream.path),
    ContentType: uploadedFile.mimetype,
  };

  console.log("Uploading to S3 with the following data:", JSON.stringify(uploadParams, null, 2));

  try {
    const upload = new Upload({
      client: s3,
      params: uploadParams,
    });

    const data = await upload.done();
    console.log("S3 Response:", data);

    return {
      url: `https://${bucketName}.s3.amazonaws.com/${key}`,
      key: key,
    };
  } catch (err) {
    console.error("Error uploading to S3:", err);
    throw new Error("Failed to upload file");
  }
};

app.post("/upload", (req, res) => {
  const form = new IncomingForm();

  form.parse(req, async (err, fields, files) => {
    if (err) {
      res.status(500).json({ error: "Error parsing form" });
      return;
    }
  
    console.log("Fields received:", fields); // לבדוק איזה נתונים מגיעים
    console.log("Full fields object:", JSON.stringify(fields, null, 2)); // בדוק מה מגיע

    const idNumber =fields.userId?.[0] || null;
    
    console.log("Extracted ID Number:", idNumber);
    
    if (!idNumber) {
      res.status(400).json({ error: "Missing ID number" });
      return;
    }

    try {
      const { url, key } = await insertObjectS3({
        file: files.file,
        bucketName: bucketName,
        idNumber,
      });

      res.status(200).json({
        message: "File uploaded successfully",
        url,
        fileKey: key,
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to upload file" });
    }
  });
});

app.get("/fileById/:userId", async (req, res) => {
    const { userId } = req.params; // קבלת ה-ID מהנתיב
    console.log(userId)
  
    if (!userId) {
      return res.status(400).json({ error: "Missing userId" });
    }
  
    try {
      const params = {
        Bucket: bucketName,
        Prefix: `${userId}/`, // מחפש קבצים לפי ת"ז
      };
  
      const command = new ListObjectsV2Command(params);
      const data = await s3.send(command);
  
      if (!data.Contents) {
        return res.json({ files: [] });
      }
  
      const files = await Promise.all(
        data.Contents.map(async (file) => {
          const command = new GetObjectCommand({
            Bucket: params.Bucket,
            Key: file.Key,
          });
      
          const signedUrl = await getSignedUrl(s3, command, { expiresIn: 3600 }); // שעה
      
          return {
            url: signedUrl,
            key: file.Key,
          };
        })
      );      
  
      res.json({ files });
    } catch (error) {
      console.error("Error fetching files:", error);
      res.status(500).json({ error: "Failed to retrieve files" });
    }
  });

  app.get("/files", async (req, res) => {
    try {
      const command = new ListObjectsV2Command({
        Bucket: bucketName,
      });
  
      const data = await s3.send(command);
  
      if (!data.Contents) {
        return res.json([]);
      }
  
      const fileUrls = await Promise.all(
        data.Contents.map(async (file) => {
          const command = new GetObjectCommand({
            Bucket: bucketName,
            Key: file.Key,
          });
      
          const signedUrl = await getSignedUrl(s3, command, { expiresIn: 3600 }); // תוקף שעה
      
          return {
            key: file.Key,
            url: signedUrl,
          };
        })
      );      
  
      res.json(fileUrls);
    } catch (error) {
      console.error("Error fetching files:", error);
      res.status(500).json({ error: "Failed to fetch files" });
    }
  });

  app.delete("/delete-file/:key", async (req, res) => {
    const key = decodeURIComponent(req.params.key);  
    console.log("Received key for deletion:", key);
  
    if (!key) {
      return res.status(400).json({ error: "Missing file key" });
    }
  
    try {
      const command = new DeleteObjectCommand({
        Bucket: bucketName,
        Key: key,
      });
  
      await s3.send(command);
      res.json({ message: "File deleted successfully" });
    } catch (error) {
      console.error("Error deleting file:", error);
      res.status(500).json({ error: "Failed to delete file" });
    }
  });
  

app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});
