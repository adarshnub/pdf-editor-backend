const express = require("express");
const bodyParser = require("body-parser");
const fileUpload = require("express-fileupload");
const fs = require("fs");
// const { PDFDocument } = require("pdf-lib");
const cors = require("cors");
const mongoose = require("mongoose");
const UserModel = require("./models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
// const PostModel = require("./models/Post");
const PdfModel = require('./models/Pdf');
const multer = require("multer");


const salt = bcrypt.genSaltSync(10);
const secret = "dfdddgdfgfgowelerererdgdglm";

const app = express();
const PORT = 3001;

//to be deleted 2 lines
const storage = multer.memoryStorage(); // Store files in memory
const upload = multer({ storage: storage });

app.use(cors({ credentials: true, origin: "http://localhost:5173" }));
app.use(fileUpload({
  limits: { fileSize: 50 * 1024 * 1024 }, 
}));
// app.use(bodyParser.json());
app.use(bodyParser.json({limit: '100mb', extended: true}))
app.use(bodyParser.urlencoded({
  limit: '50mb',
  parameterLimit: 100000,
  extended: true 
}));

app.use(cookieParser());

mongoose.connect(
  "mongodb+srv://devadarsh:myx6Er8HSbySijm7@cluster0.udoup1h.mongodb.net/?retryWrites=true&w=majority"
);




//authenticate user
// const authenticateUser = async (req, res, next) => {
//   const { token } = req.cookies;
//   try {
//     // const decoded = jwt.verify(token, secret);
//     // req.user = decoded;
//    const decoded = jwt.verify(token, secret, {}, (err,info)=> {
//       if(err) throw err;
//       res.json(info);
//     });
//     req.user = decoded;
//     next();
//   } catch (error) {
//     console.error(error)
//     res.status(401).json({ error: "Unauthorized" });
//   }
// };


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
    jwt.sign({ email, username:userDoc.username, id: userDoc._id }, secret, {}, (err, token) => {
      if (err) throw err;
      res.cookie("token", token).json("OK");
    });
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

// Check-auth_token validation
// app.get("/check-auth", authenticateUser, (req, res) => {
//   res.json(req.user);
// });


// Logout route
app.post('/logout', (req, res) => {
    res.clearCookie('token');
    res.json({ success: true });
  });
  

//pdf Schema

// const pdfSchema = new mongoose.Schema({
//   fileName : String,
//   fileData: Buffer,
//   userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
// });

// const PdfModel = mongoose.model('Pdf', pdfSchema);

//upload-working upload
// app.post('/upload', async (req,res) => {
//   try{
//     const {fileName, file} = req.body;
//     // const userId = req.user.id;

//     //base64 to binary
//     const fileData = Buffer.from(file, 'base64');

//     //save to db
//     const pdf = new PdfModel({
//       fileName,
//       fileData,
      
//     });

//     await pdf.save();
//     res.status(200).json({message:'file uploaded'});
//   } catch (error) {
//     console.error('error handling file upload');
//     res.status(500).json({error:'sever error 1'});
//   }
// })

//new try code  upload
app.post('/upload', async(req, res) => {

  try {
    const {fileName,file} = req.body;
  const fileDataNew = Buffer.from(file, 'base64');

  //user-verify
  const { token } = req.cookies;
  
  jwt.verify(token ,secret, {},async (err,info) => {
    if(err) throw err;
    const PostDoc = await PdfModel.create({
      fileName,
      fileData : fileDataNew,
      userId : info.id,
    });
    res.json(PostDoc);
  })
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }

  });
       
// binary to base64
//fs.writeFileSync('output.pdf', binaryData);


// Retrieve all PDFs -working code 
// app.get('/allpdfs', async (req, res) => {
//   try {
//     const pdfs = await PdfModel.find();
//     res.status(200).json(pdfs);
//   } catch (error) {
//     console.error('Error retrieving PDFs from the database');
//     res.status(500).json({ error: 'Server error' });
//   }
// });

app.get('/allpdfs', async (req, res) => {
  try {
    const userId = req.cookies.token ? jwt.verify(req.cookies.token, secret).id : null;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const pdfs = await PdfModel.find({ userId });
    res.status(200).json(pdfs);
  } catch (error) {
    console.error('Error retrieving PDFs from the database', error);
    res.status(500).json({ error: 'Server error' });
  }
});







//pdf feature routes
// app.post("/upload", (req, res) => {
//   if (!req.files || Object.keys(req.files).length === 0) {
//     return res.status(400).send("No files were uploaded.");
//   }

//   const pdfFile = req.files.pdf;
//   const filePath = `./uploads/${pdfFile.name}`;

//   pdfFile.mv(filePath, (err) => {
//     if (err) return res.status(500).send(err);

//     res.send("File uploaded!");
//   });
// });


// app.post("/upload", uploadMiddleware.single("file"), async (req, res) => {
//   const { originalname, path } = req.file; //creating extention
//   const parts = originalname.split(".");
//   const ext = parts[parts.length - 1];
//   const newPath = path + "." + ext; //renaming path
//   fs.renameSync(path, newPath);

//   const { token } = req.cookies;
//   jwt.verify(token, secret, {}, async (err, info) => {
//     if (err) throw err;
//     const { data } = req.body;
//     const postDoc = await PostModel.create({
     
//       cover: newPath,
//       // auther: info.id,
//     });
//     res.json('ok');
    
//   });
// });

//new code

// app.post('/upload', async (req, res) => {
//   const base64String = req.body.file;

//   // Store the base64 string in the database
//   try {
//     const fileInstance = new FileModel({ data: base64String });
//     await fileInstance.save();
//     res.status(200).json({ message: 'File uploaded successfully!' });
//   } catch (error) {
//     console.error('Error storing file in the database:', error);
//     res.status(500).json({ error: 'Internal Server Error' });
//   }
// });



// app.get("/pdf/:filename", (req, res) => {
//   const filePath = `./uploads/${req.params.filename}`;

//   fs.readFile(filePath, (err, data) => {
//     if (err) return res.status(500).send(err);

//     res.contentType("application/pdf");
//     res.send(data);
//   });
// });



// app.post("/extract-pages", async (req, res) => {
//   const { filename, selectedPages } = req.body;
//   const filePath = `./uploads/${filename}`;

//   const existingPdfBytes = fs.readFileSync(filePath);
//   const pdfDoc = await PDFDocument.load(existingPdfBytes);

//   const newPdfDoc = await PDFDocument.create();

//   for (const pageIndex of selectedPages) {
//     // Ensure pageIndex is within bounds
//     if (pageIndex > 0 && pageIndex <= pdfDoc.getPageCount()) {
//       const [copiedPage] = await newPdfDoc.copyPages(pdfDoc, [pageIndex - 1]);
//       newPdfDoc.addPage(copiedPage);
//     } else {
//       console.warn(`Page index ${pageIndex} is out of bounds.`);
//     }
//   }

//   const newPdfBytes = await newPdfDoc.save();
//   const newFilename = `new_${filename}`;
//   fs.writeFileSync(`./uploads/${newFilename}`, newPdfBytes);

//   res.send(newFilename);
// });

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
