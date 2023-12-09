const express = require("express");
const bodyParser = require("body-parser");
const fileUpload = require("express-fileupload");
const fs = require("fs");
const { PDFDocument } = require("pdf-lib");
const cors = require("cors");
const mongoose = require("mongoose");
const UserModel = require("./models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");

const PdfModel = require("./models/Pdf");
const multer = require("multer");

const salt = bcrypt.genSaltSync(10);
const secret = "dfdddgdfgfgowelerererdgdglm";

const app = express();
const PORT = 3001;

//to be deleted 2 lines
const storage = multer.memoryStorage(); // Store files in memory
const upload = multer({ storage: storage });

const allowedOrigins = ['http://localhost:5173','https://pdf-editor-enia024ct-adarshnub.vercel.app'];

app.use(cors({ credentials: true, origin: allowedOrigins }));
app.use(
  fileUpload({
    limits: { fileSize: 50 * 1024 * 1024 },
  })
);

app.use(bodyParser.json({ limit: "100mb", extended: true }));
app.use(
  bodyParser.urlencoded({
    limit: "50mb",
    parameterLimit: 100000,
    extended: true,
  })
);

app.use(cookieParser());

mongoose.connect(
  "mongodb+srv://devadarsh:myx6Er8HSbySijm7@cluster0.udoup1h.mongodb.net/?retryWrites=true&w=majority"
);

//user register route
app.post("/register", async (req, res) => {
  const { username, email, password } = req.body;

  try {
    const userDoc = await UserModel.create({
      username,
      email,
      password: bcrypt.hashSync(password, salt),
    });
    res.json(userDoc);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "server error-2" });
  }
});

//user login route
app.post("/login", async (req, res) => {
  const { email, password } = req.body;
  const userDoc = await UserModel.findOne({ email });
  const passwordOk = bcrypt.compareSync(password, userDoc.password);
  // res.json(passwordOk);
  if (passwordOk) {
    //logged in
    jwt.sign(
      { email, username: userDoc.username, id: userDoc._id },
      secret,
      {},
      (err, token) => {
        if (err) throw err;
        res.cookie("token", token).json("OK");
      }
    );
    // res.json("logged in")
  } else {
    res.status(400).json("Wrong Credentials!");
  }
});

//check-auth_token validation
app.get("/check-auth", (req, res) => {
  const { token } = req.cookies;
  jwt.verify(token, secret, {}, (err, info) => {
    if (err) throw err;
    res.json(info);
  });
  // res.json(req.cookies);
});

// Logout route
app.post("/logout", (req, res) => {
  res.clearCookie("token");
  res.json({ success: true });
});



//ppdf upload
app.post("/upload", async (req, res) => {
  try {
    const { fileName, file } = req.body;
     console.log('file 1111',file.slice(0,100));
    // const pdfDoc = await PDFDocument.load(file);
   
     const fileDataTobufferObject = Buffer.from(file, "base64");
    // console.log('pdf buffer file :',fileDataTobufferObject)

    //user-verify
    const { token } = req.cookies;

    jwt.verify(token, secret, {}, async (err, info) => {
      if (err) throw err;
      const PostDoc = await PdfModel.create({
        fileName,
        fileData: fileDataTobufferObject,
        userId: info.id,
      });
      res.json(PostDoc);
   
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});



//Retrieve all PDFs 
app.get('/allpdfs', async (req, res) => {
  try {
    const {token} = req.cookies;
    const {id} = jwt.verify(token,secret);

    const userPdfs = await PdfModel.find({userId:id},'fileName');

    res.status(200).json(userPdfs);
  } catch (error) {
    console.error(error,'Error retrieving PDFs from the database');
    res.status(500).json({ error: 'Server error' });
  }
});

// delete-PDF
app.delete('/pdf/:pdfId', async (req,res) => {
  try{
    const {token} = req.cookies;
    const {id} = jwt.verify(token,secret);

    const pdfToDelete = await PdfModel.findOne({
      _id: req.params.pdfId,
      userId: id,
    });

    if(!pdfToDelete) {
      return res.status(404).json({error: "pdf-nnot found"})
    }
    await PdfModel.findByIdAndDelete(req.params.pdfId);
    res.status(200).json({success: true,message:"Pdf deleted"})
  }catch(error) {
    console.error(error,'error deleting from database');
    res.status(500).json({error:'catch pdf delete error'})
  }
})


//extract selected pages from PDF
app.post('/extract-pages', async (req,res) => {
  try{
    const {pdfId, selectedPages} = req.body;
    console.log('pdf id',pdfId)
    console.log('selected pages',selectedPages);
    const originalPdf = await PdfModel.findById(pdfId);

    const base64String = originalPdf.fileData.toString('base64');
    console.log('base 64',base64String.slice(0,100));

   

    //pdf-lib
    
    const pdfDoc = await PDFDocument.load(base64String);
    console.log('pdf doc as buffer object',pdfDoc)
    const newPdfDoc = await PDFDocument.create();
    console.log( 'new ppdf-lib processed pdf doc',newPdfDoc)

    for(const pageNum of selectedPages) {
      const [copiedPage] = await newPdfDoc.copyPages(pdfDoc,[pageNum-1]);
      newPdfDoc.addPage(copiedPage);
    }

    const newPdfBytes = await newPdfDoc.save();
    console.log('newpdfBytes',newPdfBytes)

    //to-buffer-type
    const newPdfBuffer = Buffer.from(newPdfBytes);

    console.log('newppdfBuffer', newPdfBuffer)

    //save new pdf to db
    const newPdf = new PdfModel({
      fileName: 'new-pdf',
      fileData: newPdfBuffer,
      userId: originalPdf.userId,
    });
    const savedPdf = await newPdf.save();

    const base64StringOfSavedPdf = savedPdf.fileData.toString('base64');
    console.log('base 64',base64StringOfSavedPdf.slice(0,100));

    
    
    res.json(base64StringOfSavedPdf);
  
  }catch(error) {
    console.error('error extracting the pages bknd  error 1',error);
    res.status(500).json({error:"extract pages bknd error 2"})
  }
})

//get pdf by id
app.get('/pdf/:pdfId', async (req, res) => {
  try {
    const {pdfId} = req.params;
    const pdf = await PdfModel.findById(pdfId);

    if(!pdf) {
      return res.status(404).json({error: 'PDF not found'});
    }
    const base64String = pdf.fileData.toString('base64');
    res.send(base64String);
  } catch (error) {
    console.error('error fetching pdf ',error);
  }
})





app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
