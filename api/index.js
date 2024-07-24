const express = require('express');
const multer = require('multer');
const admin = require('firebase-admin');
const cors = require('cors');
const dotenv = require('dotenv');
const app = express();

dotenv.config();
app.use(cors({ origin: 'https://fotos-front-apresentation.vercel.app' }));
app.use(express.json({ limit: '10mb' }));

admin.initializeApp({
  credential: admin.credential.cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  }),
  storageBucket: `${process.env.FIREBASE_PROJECT_ID}.appspot.com`
});

const bucket = admin.storage().bucket();

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

app.post('/upload', upload.single('image'), (req, res) => {
  const { names } = req.body;
  console.log(req.body);
  if (!req.file || !names) {
    console.error("Erro no upload: Nenhum arquivo ou nome recebido");
    return res.status(400).json({ message: 'Erro no upload: Nenhum arquivo ou nome recebido' });
  }

  const blob = bucket.file(`images/${Date.now()}_${req.file.originalname}`);
  const blobStream = blob.createWriteStream({
    metadata: {
      contentType: req.file.mimetype,
      metadata: {
        names: names
      }
    }
  });

  blobStream.on('error', (err) => {
    console.error("Erro ao fazer upload para o Firebase Storage:", err);
    res.status(500).json({ message: 'Erro ao fazer upload para o Firebase Storage' });
  });

  blobStream.on('finish', () => {
    const publicUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(blob.name)}?alt=media`;
    console.log("Imagem enviada para o Firebase Storage:", publicUrl);
    res.json({ message: 'Imagem recebida!', location: publicUrl, names: names });
  });

  blobStream.end(req.file.buffer);
});

app.get('/images', async (req, res) => {
  try {
    const [files] = await bucket.getFiles({ prefix: 'images/' });
    const imagePromises = files.map(async (file) => {
      const [metadata] = await file.getMetadata();
      const [contents] = await file.download();
      return {
        name: metadata.name,
        contentType: metadata.contentType,
        base64: contents.toString('base64'),
        names: metadata.metadata.names || 'N/A'
      };
    });
    const images = await Promise.all(imagePromises);
    res.json(images);
  } catch (err) {
    console.error("Erro ao listar objetos no Firebase Storage:", err);
    res.status(500).json({ message: "Não foi possível acessar as imagens" });
  }
});

app.listen(3000, () => {
  console.log('Servidor rodando na porta 3000');
});

module.exports = app;
