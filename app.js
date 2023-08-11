const express = require("express");
const axios = require("axios");
const bodyParser = require("body-parser");
const Sentry = require("@sentry/node");
const { initializeApp } = require("firebase/app");
const {
  getStorage,
  listAll,
  ref,
  getDownloadURL,
  deleteObject,
  uploadBytes,
} = require("firebase/storage");
const {
  getFirestore,
  collection,
  addDoc,
  Timestamp,
  getDocs,
  getDoc,
  doc,
  query,
  orderBy,
  limit,
  deleteDoc,
} = require("firebase/firestore"); // Use full Firestore package
const {
  getAuth,
  setPersistence,
  browserLocalPersistence,
  signInWithEmailAndPassword,
} = require("firebase/auth");
const firebaseConfig = require("./firebase"); // Import the configuration data
const dotenv = require("dotenv");
dotenv.config();

const limit_req = require("express-limit").limit;

const app = express();

// Initialize Firebase with the configuration data
const fapp = initializeApp(firebaseConfig);
const db = getFirestore(fapp);
const auth = getAuth(fapp); // Get the Auth object
const storage = getStorage(fapp);
setPersistence(auth, browserLocalPersistence);

app.use(express.json()); // Parse JSON request bodies

// Set the template engine
app.set("view engine", "ejs");
app.use("/assets", express.static("public"));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.raw({ type: "image/png" }));

// Include the 'multer' package for handling file uploads
const fileUpload = require("express-fileupload");
app.use(fileUpload());

// firebase auth middleware
function ensureAuthenticated(req, res, next) {
  const user = auth.currentUser;

  if (user) {
    // If the user is authenticated, proceed to the next middleware or route handler
    req.user = user;
    next();
  } else {
    // If the user is not authenticated, redirect to the login page
    res.redirect("/login");
  }
}

Sentry.init({
  dsn: process.env.SENTRY_DNS,
  integrations: [
    // enable HTTP calls tracing
    new Sentry.Integrations.Http({
      tracing: true,
    }),
    // enable Express.js middleware tracing
    new Sentry.Integrations.Express({
      app,
    }),
  ],
  // Performance Monitoring
  tracesSampleRate: 1.0, // Capture 100% of the transactions, reduce in production!,
});

// Trace incoming requests
// UC
// app.use(Sentry.Handlers.requestHandler());
// app.use(Sentry.Handlers.tracingHandler());

app.get(
  "/",
  limit_req({
    max: 10, // 10 requests
    period: 60 * 1000, // per minute (60 seconds)
  }),
  async (req, res) => {
    const user = auth.currentUser;
    let urls = await getUrls("Gallery");

    for (let i = 0; i < urls.length; i++) {
      const item = urls[i];
      const pathParts = item.path.split(".");
      urls[i].path = pathParts[0];
    }
    res.render("home", {
      activePage: "home",
      logout: false,
      urls: urls,
      user: user != null ? user : false,
    });
  }
);
app.get(
  "/about",
  limit_req({
    max: 10, // 10 requests
    period: 60 * 1000, // per minute (60 seconds)
  }),
  (req, res) => {
    const user = auth.currentUser;
    res.render("about", {
      activePage: "about",
      logout: false,
      user: user != null ? user : false,
    });
  }
);

app.get(
  "/wws",
  limit_req({
    max: 10, // 10 requests
    period: 60 * 1000, // per minute (60 seconds)
  }),
  (req, res) => {
    const user = auth.currentUser;
    res.render("services", {
      activePage: "services",
      logout: false,
      user: user != null ? user : false,
    });
  }
);

const services = [
  {
    id: "PE",
    title: "Precision Engineering",
    img: "https://cdn.thomasnet.com/insights-images/embedded-images/ba20fdcd-10da-4764-b609-7f3507d2bb60/f7cef038-a108-404f-8212-c2f82adc16ea/Medium/modern-machining-tools-min.jpg",
    body: [
      "Our Precision Engineering services combine cutting-edge technology and expert craftsmanship to deliver components with exceptional accuracy and performance. From concept to production, we ensure seamless execution and offer tailored solutions for even the most complex engineering challenges.",
      "With a focus on precision, our engineering team utilizes advanced tools and techniques to transform ideas into reality. We take pride in delivering high-quality components that meet and exceed industry standards.",
    ],
  },
  {
    id: "PS",
    title: "Prototyping Solutions",
    img: "https://www.automation.com/getmedia/f9449c59-f021-4b9d-95fe-f9940a1590f8/PAE178---Image",
    body: [
      "Embrace innovation with our Prototyping Solutions, where ideas come to life. Our rapid prototyping techniques allow quick materialization of concepts, providing functional prototypes for testing and validation.",
      "From design refinement to the final iteration, we guide you through the journey of turning ideas into reality, ensuring your products are ready to perform in the real world.",
    ],
  },
  {
    id: "CCS",
    title: "Custom Casting Solutions",
    img: "https://bernierinc.com/wp-content/uploads/2018/02/download-600x350.jpg",
    body: [
      "Our Custom Casting Solutions offer a diverse range of casting processes tailored to your specific requirements. Whether it's investment casting, sand casting, or die casting, we have the expertise to provide efficient and cost-effective solutions.",
      "With an emphasis on quality and precision, we produce castings that meet the highest industry standards. Let our experienced team bring your designs to life through our advanced casting capabilities.",
    ],
  },
  {
    id: "MA",
    title: "Material Analysis",
    img: "https://mc-68095c24-9d47-44d2-a4ee-620361-cdn-endpoint.azureedge.net/-/media/images/services/materials-testing/chemical-analysis-preparation-640x480.jpg?rev=9fd0ba28146142b890b1e070ff7cd819",
    body: [
      "Unlock the full potential of your materials with our Material Analysis services. Through rigorous testing and analysis, we help you understand the characteristics and behavior of your materials under different conditions.",
      "Our state-of-the-art laboratory and experienced team ensure accurate results and valuable insights, enabling you to make informed decisions for your projects and applications.",
    ],
  },
  {
    id: "MS",
    title: "Machining Services",
    img: "https://i.ytimg.com/vi/osqX7iQEnuI/maxresdefault.jpg",
    body: [
      "Experience precision machining with our Machining Services. From simple components to complex parts, we utilize advanced CNC machines and skilled operators to achieve tight tolerances and impeccable finishes.",
      "Our commitment to delivering excellence in machining means you can rely on us for high-quality products that meet your exact specifications, every time.",
    ],
  },
  {
    id: "QI",
    title: "Quality Inspection",
    img: "https://www.compliancequest.com/wp-content/uploads/2023/06/quality-control-inspection-video.jpg",
    body: [
      "At Ganga Technocast, we prioritize quality through our comprehensive Quality Inspection services. Our dedicated team uses advanced inspection equipment to ensure each component undergoes rigorous checks for accuracy and adherence to standards.",
      "With our commitment to quality assurance, we guarantee the utmost reliability and consistency in every casting and manufacturing process.",
    ],
  },
];

// app.get("/service-d", (req, res) => {
//   res.render("service-details", { activePage: "services" });
// });

app.get(
  "/service-d",
  limit_req({
    max: 10, // 10 requests
    period: 60 * 1000, // per minute (60 seconds)
  }),
  (req, res) => {
    const user = auth.currentUser;
    const serviceID = req.query.service;
    const service = services.find((service) => service.id === serviceID);
    if (!service) {
      // If the service is not found, you can handle the error or render an error page
      // res.status(404).send("Service not found");
      res.render("services", {
        activePage: "services",
        logout: false,
        user: user != null ? user : false,
      });
    } else {
      // Render the service-details page with the corresponding service data
      res.render("service-details", {
        activePage: "services",
        data: service,
        logout: false,
        user: user != null ? user : false,
      });
    }
  }
);
app.get(
  "/projects",
  limit_req({
    max: 10, // 10 requests
    period: 60 * 1000, // per minute (60 seconds)
  }),
  async (req, res) => {
    const user = auth.currentUser;
    let urls = await getUrls("Gallery");

    for (let i = 0; i < urls.length; i++) {
      const item = urls[i];
      const pathParts = item.path.split(".");
      urls[i].path = pathParts[0];
    }

    res.render("projects", {
      activePage: "projects",
      logout: false,
      urls: urls,
      user: user != null ? user : false,
    });
  }
);

app.get(
  "/ic",
  limit_req({
    max: 10, // 10 requests
    period: 60 * 1000, // per minute (60 seconds)
  }),
  (req, res) => {
    const user = auth.currentUser;
    res.render("ic", {
      activePage: "ic",
      logout: false,
      user: user != null ? user : false,
    });
  }
);

app.get(
  "/contact",
  limit_req({
    max: 10, // 10 requests
    period: 60 * 1000, // per minute (60 seconds)
  }),
  (req, res) => {
    const user = auth.currentUser;
    res.render("contact", {
      activePage: "contact",
      logout: false,
      user: user != null ? user : false,
    });
  }
);

app.get(
  "/blog",
  limit_req({
    max: 10, // 10 requests
    period: 60 * 1000, // per minute (60 seconds)
  }),
  async (req, res) => {
    const user = auth.currentUser;
    const q = query(
      collection(db, "blogs"),
      orderBy("timestamp", "desc"),
      limit(20)
    );
    let blogs = await getBlogImageURL(q);
    res.render("blog", {
      activePage: "blog",
      logout: false,
      blogs: blogs[0],
      user: user != null ? user : false,
    });
  }
);

app.get(
  "/blog_view",
  limit_req({
    max: 10, // 10 requests
    period: 60 * 1000, // per minute (60 seconds)
  }),
  async (req, res) => {
    const user = auth.currentUser;
    try {
      console.log(req.query);
      const docRef = doc(db, "blogs", req.query.id);
      const docSnap = await getDoc(docRef);
      const data = docSnap.data();
      data.blog_tags = data.blog_tags.split(",");
      data.timestamp = formatMonthAndDate(data.timestamp.seconds);
      res.render("blog_view", {
        activePage: "blog",
        logout: false,
        blogs: data,
        user: user != null ? user : false,
      });
    } catch (error) {
      console.log(error)
      res.redirect("/blog");
    }
  }
);

app.get(
  "/admin",
  limit_req({
    max: 10, // 10 requests
    period: 60 * 1000, // per minute (60 seconds)
  }),
  ensureAuthenticated,
  async (req, res) => {
    const user = auth.currentUser;
    const pg = req.query.pg;
    const action = req.query.action;
    const imgURL = req.query.imgurl;

    console.log(req.query);

    if (pg != undefined) {
      if (pg == "Gallery") {
        // Checks if the action is to delete
        if (action == "delete") {
          await deleteImage(imgURL);
        }
        // get all links to the image
        let urls = await getUrls("Gallery");
        res.render("admin", {
          activePage: "admin",
          logout: true,
          pg: pg,
          urls: urls,
          user: user != null ? user : false,
        });
      } else if (pg == "Quotes") {
        let quoteList = [];
        // const snapshot = await getDocs(collection(db, "quotes"));
        const q = query(
          collection(db, "quotes"),
          orderBy("timestamp", "desc"),
          limit(20)
        );
        const snapshot = await getDocs(q);
        snapshot.forEach((doc) => {
          let data = doc.data();
          let time = formatMonthAndDate(data.timestamp.seconds);
          quoteList.push({
            id: doc.id,
            email: data.email,
            name: data.name,
            timestamp: time,
            material: data.material,
            message: data.message,
            phone: data.phone,
          });
        });

        res.render("admin", {
          activePage: "admin",
          logout: true,
          pg: pg,
          quoteList: quoteList,
          user: user != null ? user : false,
        });
      } else if (pg == "Messages") {
        let messageList = [];
        // const snapshot = await getDocs(collection(db, "quotes"));
        const q = query(
          collection(db, "contact_us"),
          orderBy("timestamp", "desc"),
          limit(20)
        );
        const snapshot = await getDocs(q);
        snapshot.forEach((doc) => {
          let data = doc.data();
          let time = formatMonthAndDate(data.timestamp.seconds);
          messageList.push({
            id: doc.id,
            email: data.email,
            name: data.name,
            timestamp: time,
            material: data.material,
            message: data.message,
            phone: data.phone,
          });
        });
        console.log(messageList);
        res.render("admin", {
          activePage: "admin",
          logout: true,
          pg: pg,
          messageList: messageList,
          user: user != null ? user : false,
        });
      } else if (pg == "Edits") {
        let repots = [];
        // const snapshot = await getDocs(collection(db, "quotes"));
        const q = query(
          collection(db, "reports"),
          orderBy("timestamp", "desc"),
          limit(20)
        );
        const snapshot = await getDocs(q);
        snapshot.forEach((doc) => {
          let data = doc.data();
          let time = formatMonthAndDate(data.timestamp.seconds);
          repots.push({
            id: doc.id,
            name: data.name,
            comment: data.comment,
            timestamp: time,
            title: data.title,
            update_selection: data.update_selection,
            your_selection: data.your_selection,
            url: data.url,
          });
        });

        res.render("admin", {
          activePage: "admin",
          logout: true,
          pg: pg,
          repots: repots,
          user: user != null ? user : false,
        });
      } else if (pg == "Blog") {
        res.render("admin", {
          activePage: "admin",
          logout: true,
          pg: pg,
          user: user != null ? user : false,
        });
      } else if (pg == "VBlog") {
        const q = query(
          collection(db, "blogs"),
          orderBy("timestamp", "desc"),
          limit(20)
        );

        let blogs = await getBlogImageURL(q);

        res.render("admin", {
          activePage: "admin",
          logout: true,
          pg: pg,
          blogs: blogs[0],
          user: user != null ? user : false,
        });
      }
    } else {
      let quoteList = [];
      const q = query(
        collection(db, "quotes"),
        orderBy("timestamp", "desc"),
        limit(20)
      );
      const snapshot = await getDocs(q);

      snapshot.forEach((doc) => {
        let data = doc.data();
        let time = formatMonthAndDate(data.timestamp.seconds);
        quoteList.push({
          id: doc.id,
          email: data.email,
          name: data.name,
          timestamp: time,
          material: data.material,
          message: data.message,
          phone: data.phone,
        });
      });
      res.render("admin", {
        activePage: "admin",
        logout: true,
        pg: "Quotes",
        quoteList: quoteList,
        user: user != null ? user : false,
      });
    }
  }
);

// gallery image upload
app.post(
  "/admin",
  limit_req({
    max: 20, // 20 requests
    period: 60 * 1000, // per minute (60 seconds)
  }),
  ensureAuthenticated,
  async (req, res) => {
    // Access the file u.file
    const fileData = req.files.file.data;
    let status = await uploadImage(fileData, req.files.file.name);
    if (status) {
      res.sendStatus(200);
    } else {
      res.sendStatus(200).send(status);
    }
  }
);

app.post(
  "/blogpost",
  limit_req({
    max: 20, // 20 requests
    period: 60 * 1000, // per minute (60 seconds)
  }),
  ensureAuthenticated,
  async (req, res) => {
    // Access the file u.file
    const fileData = req.files.file.data;

    // let status = await uploadImage(fileData, req.files.file.name);

    const storageRef = ref(storage, `Blogs/${req.files.file.name}`);

    await uploadBytes(storageRef, fileData)
      .then(async () => {
        console.log("File uploaded to Firebase Storage!");
        // Optionally, you can remove the file from the server after uploading to Firebase Storage
        // fs.unlinkSync(file.path);
        await getDownloadURL(ref(storage, `Blogs/${req.files.file.name}`)).then(
          (url) => {
            const blogpost = {
              img: url,
              blog_title: req.body.bt,
              blog_subtitle: req.body.st,
              blog_body: req.body.body,
              blog_tags: req.body.tags,
              blog_group: req.body.group,
            };
            blogpost.timestamp = Timestamp.now();

            const quotesCollection = collection(db, "blogs");

            // Write the data to Firestore using the `add` method, which returns a promise
            addDoc(quotesCollection, blogpost)
              .then(() => {
                res.redirect("/admin");
              })
              .catch((error) => {
                res.sendStatus(404).send({ message: error });
              });
          }
        );
      })
      .catch((error) => {
        console.error("Error uploading file to Firebase Storage:", error);
        res.sendStatus(404).send({ message: error });
      });
  }
);

app.post(
  "/report_change",
  limit_req({
    max: 200, // 20 requests
    period: 60 * 1000, // per minute (60 seconds)
  }),
  ensureAuthenticated,
  (req, res) => {
    // Access the file u.file

    const data = req.body;
    data.timestamp = Timestamp.now();
    const quotesCollection = collection(db, "reports");

    // Write the data to Firestore using the `add` method, which returns a promise
    addDoc(quotesCollection, data)
      .then(() => {
        res.status(200).send({ message: "Your change had been reported" });
      })
      .catch((error) => {
        res.status(404).send({ message: error });
      });
  }
);

app.get(
  "/delete_report",
  limit_req({
    max: 200, // 20 requests
    period: 60 * 1000, // per minute (60 seconds)
  }),
  ensureAuthenticated,
  async (req, res) => {
    // Access the file u.file
    console.log(req.query.id);

    deleteDoc(doc(db, `reports/${req.query.id}`))
      .then(() => {
        res.redirect("/admin?pg=Edits");
      })
      .catch((error) => {
        console.log(error);
        res.status(404).send({ message: error });
      });
  }
);

// Helper Functions

async function getBlogImageURL(q) {
  const snapshot = await getDocs(q);

  // Create an array to hold the Promise for each download URL
  const downloadURLPromises = snapshot.docs.map(async (doc) => {
    let data = doc.data();
    try {
      let time = formatMonthAndDate(data.timestamp.seconds);
      return {
        id: doc.id,
        img: data.img,
        blog_body: data.blog_body,
        timestamp: time,
        blog_subtitle: data.blog_subtitle,
        blog_title: data.blog_title,
        blog_tags: data.blog_tags.split(","),
        blog_group: data.blog_group,
      };
    } catch (error) {
      // Handle any errors when retrieving the download URL
      console.error("Error getting download URL:", error);
      return null;
    }
  });

  // Wait for all the download URL promises to resolve
  const blogs = await Promise.all(downloadURLPromises);

  // Filter out any null values in case of errors
  return [
    blogs.filter((blog) => blog !== null),
    snapshot.docs[snapshot.docs.length - 1],
  ];
}

function secondsToDate(seconds) {
  const milliseconds = seconds * 1000;
  return new Date(milliseconds);
}

function formatMonthAndDate(date1) {
  const date = secondsToDate(date1);
  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const month = monthNames[date.getMonth()];
  const day = date.getDate();
  const year = date.getFullYear();
  return `${month} ${day}, ${year}`;
}

// TODO: Add Pagination to the function.
async function getUrls(path) {
  const listRef = ref(storage, path);
  const URLS = [];

  try {
    const res = await listAll(listRef);

    const promises = res.items.map(async (itemRef) => {
      try {
        const url = await getDownloadURL(ref(storage, itemRef.fullPath));
        URLS.push({
          url: url,
          path: itemRef.fullPath.split("/")[1],
        });
      } catch (error) {
        console.log(error);
      }
    });

    // Wait for all the promises to resolve
    await Promise.all(promises);

    return URLS;
  } catch (error) {
    console.log(error);
    return URLS;
  }
}

async function deleteImage(url) {
  // Create a reference to the file to delete
  const desertRef = ref(storage, `Gallery/${url}`);
  console.log(url);

  // Delete the file
  await deleteObject(desertRef)
    .then(() => {
      // File deleted successfully
      console.log("File deleted successfully");
      return true;
    })
    .catch((error) => {
      // Uh-oh, an error occurred!
      console.log(error);
      return error;
    });
}

async function uploadImage(data, name) {
  const storageRef = ref(storage, `Gallery/${name}`);

  await uploadBytes(storageRef, data)
    .then((snapshot) => {
      console.log("File uploaded to Firebase Storage!");
      // Optionally, you can remove the file from the server after uploading to Firebase Storage
      // fs.unlinkSync(file.path);
      console.log(snapshot);
      return true;
    })
    .catch((error) => {
      console.error("Error uploading file to Firebase Storage:", error);
      return error;
    });
}
// End of Helper Functions

app.get(
  "/login",
  limit_req({
    max: 10, // 10 requests
    period: 60 * 1000, // per minute (60 seconds)
  }),
  (req, res) => {
    const user = auth.currentUser;
    res.render("login", {
      activePage: "login",
      logout: false,
      user: user != null ? user : false,
    });
  }
);

// Handle login form submission
app.post(
  "/login",
  limit_req({
    max: 10, // 10 requests
    period: 60 * 1000, // per minute (60 seconds)
  }),
  (req, res) => {
    const email = req.body.email;
    const password = req.body.password;

    // Authenticate the user using Firebase Authentication
    // Implement the appropriate authentication method (e.g., email/password, Google login, etc.)

    // For example, using Firebase email/password authentication:
    signInWithEmailAndPassword(auth, email, password) // Use the auth object
      .then((userCredential) => {
        // User login successful
        const user = userCredential.user;
        console.log("User logged in:", user.email);
        // Redirect the user to the dashboard or any other page
        res.redirect("/admin");
      })
      .catch((error) => {
        // Handle login errors here
        console.error("Login error:", error.message);
        // Redirect the user back to the login page with an error message (if needed)
        res.redirect("/login?error=" + encodeURIComponent(error.message));
      });
  }
);

app.get(
  "/logout",
  limit_req({
    max: 10, // 10 requests
    period: 60 * 1000, // per minute (60 seconds)
  }),
  (req, res) => {
    auth
      .signOut()
      .then(() => {
        // User logged out successfully
        res.redirect("/login");
      })
      .catch(() => {
        res.redirect("/admin"); // Redirect to dashboard or any other page with an error message
      });
  }
);

app.post(
  "/submit-quote",
  limit_req({
    max: 10, // 10 requests
    period: 60 * 1000, // per minute (60 seconds)
  }),
  async (req, res) => {
    const data = req.body;

    const edata = {
      service_id: process.env.SERVICE_ID,
      template_id: "template_fowxi8q",
      user_id: process.env.USER_ID,
      template_params: {
        reply_to: "divyanshukalola88@gmail.com",
        to_name: "Divyanshu Kalola",
        message:
          "We hope this email finds you well. Thank you for reaching out to us. We are thrilled that you have chosen to connect with Ganga Technocast.\n\nAt Ganga Technocast, we take immense pride in delivering precision-engineered casting solutions to meet our clients' unique requirements. Your interest in our services means a lot to us, and we are committed to providing you with the best possible assistance throughout your casting journey.\n\nWe have received your inquiry, and our dedicated team is already working to address your specific needs. Rest assured, we will spare no effort to offer tailored solutions and ensure your experience with us is seamless and productive.\n\nAs a leading investment casting firm, we combine cutting-edge technology and expert craftsmanship to deliver components of exceptional quality and accuracy. Whether you require custom casting solutions or material analysis, we have the expertise to meet your demands.\n\nOne of our casting specialists will be in touch with you shortly to discuss your project in detail and provide further information. If you have any immediate questions or concerns, feel free to contact us at [Your Contact Number] during our business hours.\n\nThank you once again for considering Ganga Technocast as your investment casting partner. We value your trust and look forward to forging a successful collaboration with you.\n\nWarm regards,",
      },
      accessToken: process.env.ACCESS_TOCKEN,
    };

    const edata2 = {
      service_id: process.env.SERVICE_ID,
      template_id: "template_z6kej7j",
      user_id: process.env.USER_ID,
      template_params: {
        reply_to: "gangatechnocastllp@gmail.com",
        from_name: data.name,
        from_email: data.email,
        from_phone: data.phone,
        from_subject: `Quote from ${data.name}. Material: ${data.material}`,
        from_message: `Material: ${data.material}\n${data.message}`,
        from_tag: "Received - Quote",
      },
      accessToken: process.env.ACCESS_TOCKEN,
    };

    data.timestamp = Timestamp.now();
    try {
      // Reference to the Firestore collection where you want to store the data
      const quotesCollection = collection(db, "quotes");

      // Write the data to Firestore using the `add` method, which returns a promise
      const docRef = await addDoc(quotesCollection, data);
      console.log("Document written with ID: ", docRef.id);

      axios
        .post("https://api.emailjs.com/api/v1.0/email/send", edata2)
        .then((response) => {
          console.log("Email sent successfully!", response.data);
        })
        .catch((error) => {
          console.error("Error sending email:", error.response.data);
          res.status(500).json({
            success: false,
            message: "Data is recoded but email was not able to sent.",
          });
        });

      axios
        .post("https://api.emailjs.com/api/v1.0/email/send", edata)
        .then((response2) => {
          console.log("Email sent successfully!", response2.data);
          res.status(201).json({
            success: true,
            message: "Quote submitted successfully!",
          });
        })
        .catch((error) => {
          console.error("Error sending email:", error.response.data);
          res.status(500).json({
            success: false,
            message: "Data is recoded but email was not able to sent.",
          });
        });
    } catch (error) {
      console.error("Error adding document: ", error);
      res
        .status(500)
        .json({ success: false, message: "Error adding document" });
    }
  }
);

app.post(
  "/contact-us",
  limit_req({
    max: 10, // 10 requests
    period: 60 * 1000, // per minute (60 seconds)
  }),
  async (req, res) => {
    const data = req.body;
    console.log(data);

    const edata = {
      service_id: process.env.SERVICE_ID,
      template_id: "template_z6kej7j",
      user_id: process.env.USER_ID,
      template_params: {
        reply_to: "gangatechnocastllp@gmail.com",
        from_name: data.name,
        from_email: data.email,
        from_phone: data.phone,
        from_subject: data.subject,
        from_message: data.message,
        from_tag: "Received - Contact US",
      },
      accessToken: process.env.ACCESS_TOCKEN,
    };

    data.timestamp = Timestamp.now();
    try {
      // Reference to the Firestore collection where you want to store the data
      const quotesCollection = collection(db, "contact_us");

      // Write the data to Firestore using the `add` method, which returns a promise
      const docRef = await addDoc(quotesCollection, data);
      console.log("Document written with ID: ", docRef.id);

      axios
        .post("https://api.emailjs.com/api/v1.0/email/send", edata)
        .then((response) => {
          console.log("Email sent successfully!", response.data);
          res
            .status(201)
            .json({ success: true, message: "Quote submitted successfully!" });
        })
        .catch((error) => {
          console.error("Error sending email:", error.response.data);
          res.status(500).json({
            success: false,
            message: "Data is recoded but email was not able to sent.",
          });
        });
    } catch (error) {
      console.error("Error adding document: ", error);
      res
        .status(500)
        .json({ success: false, message: "Error adding document" });
    }
  }
);
// The error handler must be registered before any other error middleware and after all controllers
// app.use(Sentry.Handlers.errorHandler());

const port = 3000;
const server = app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});

module.exports = { app, server, getUrls };
