
const express = require('express');
const bodyParser = require('body-parser');
const fileUpload = require('express-fileupload');
const fs = require('fs');
const { PDFDocument } = require('pdf-lib');
const cors = require('cors');
const mongoose = require('mongoose');
const UserModel = require('./models/User');
const bcrypt  = require('bcryptjs');


const salt = bcrypt.genSaltSync(10);


const app = express();
const PORT = 3001;

app.use(cors());
app.use(fileUpload());
app.use(bodyParser.json());

mongoose.connect('mongodb+srv://devadarsh:myx6Er8HSbySijm7@cluster0.udoup1h.mongodb.net/?retryWrites=true&w=majority');


//user create/register
app.post('/register', async (req,res) => {
    const {username,email, password} = req.body;
    
    try {
        const userDoc = await UserModel.create({
            username,
            email,
            password : bcrypt.hashSync(password,salt),
        });
        res.json(userDoc);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'server error-'})
    }
})


app.post('/upload', (req, res) => {
  if (!req.files || Object.keys(req.files).length === 0) {
    return res.status(400).send('No files were uploaded.');
  }

  const pdfFile = req.files.pdf;
  const filePath = `./uploads/${pdfFile.name}`;

  pdfFile.mv(filePath, (err) => {
    if (err) return res.status(500).send(err);

    res.send('File uploaded!');
  });
});

app.get('/pdf/:filename', (req, res) => {
  const filePath = `./uploads/${req.params.filename}`;

  fs.readFile(filePath, (err, data) => {
    if (err) return res.status(500).send(err);

    res.contentType('application/pdf');
    res.send(data);
  });
});

app.post('/extract-pages', async (req, res) => {
  const { filename, selectedPages } = req.body;
  const filePath = `./uploads/${filename}`;

  const existingPdfBytes = fs.readFileSync(filePath);
  const pdfDoc = await PDFDocument.load(existingPdfBytes);

  const newPdfDoc = await PDFDocument.create();
//   selectedPages.forEach((pageIndex) => {
//     // const [copiedPage] = newPdfDoc.copyPages(pdfDoc, [pageIndex - 1]);
//     const copiedPages = newPdfDoc.copyPages(pdfDoc, [pageIndex - 1]);
//     const copiedPage = copiedPages[0];
//     newPdfDoc.addPage(copiedPage);
//   });
for (const pageIndex of selectedPages) {
    // Ensure pageIndex is within bounds
    if (pageIndex > 0 && pageIndex <= pdfDoc.getPageCount()) {
      const [copiedPage] = await newPdfDoc.copyPages(pdfDoc, [pageIndex - 1]);
      newPdfDoc.addPage(copiedPage);
    } else {
      console.warn(`Page index ${pageIndex} is out of bounds.`);
    }
  }


  const newPdfBytes = await newPdfDoc.save();
  const newFilename = `new_${filename}`;
  fs.writeFileSync(`./uploads/${newFilename}`, newPdfBytes);

  res.send(newFilename);
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
