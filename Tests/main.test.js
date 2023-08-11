const request = require("supertest");
const { app, server } = require("../app");

// Close the server after all the tests have finished
afterAll((done) => {
  server.close(done);
});

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

describe("Test routes", () => {
  // route content tests
  test("GET / should return status code 200 and render the home page", async () => {
    const response = await request(app).get("/");
    expect(response.status).toBe(200);
    expect(response.text).toContain("<title>Ganga Technocast - Home</title>");
  });

  test("GET /about should return status code 200 and render the about page", async () => {
    const response = await request(app).get("/about");
    expect(response.status).toBe(200);
    expect(response.text).toContain("<title>Ganga Technocast - About</title>");
  });

  test("GET /wws should return status code 200 and render the services page", async () => {
    const response = await request(app).get("/wws");
    expect(response.status).toBe(200);
    expect(response.text).toContain(
      "<title>Ganga Technocast - Services</title>"
    ); // Assuming your "services" page has this title
  });

  test("GET /service-d should return status code 200 and render the services page when serviceID is not found", async () => {
    const response = await request(app).get("/service-d");
    expect(response.status).toBe(200);
    expect(response.text).toContain(
      "<title>Ganga Technocast - Services</title>"
    );
    expect(response.text).toContain(
      "<title>Ganga Technocast - Services</title>"
    );
  });

  test("GET /service-d should return status code 200 and render the service-details page when serviceID is found", async () => {
    const serviceID = "PE";
    const response = await request(app).get(`/service-d?service=${serviceID}`);
    expect(response.status).toBe(200);
    expect(response.text).toContain(
      `<title>Ganga Technocast - ${services[0].id}</title>`
    );
    expect(response.text).toContain(services[0].title);
    expect(response.text).toContain(services[0].body[0]);
    expect(response.text).toContain(services[0].body[1]);
  });

  test("GET /projects should return status code 200 and render the projects page with correct data", async () => {
    const response = await request(app).get("/projects");
    expect(response.status).toBe(200);
    expect(response.text).toContain(
      "<title>Ganga Technocast - Projects</title>"
    );
  });

  test("GET /ic should return status code 200 and render the projects page with correct data", async () => {
    const response = await request(app).get("/ic");
    expect(response.status).toBe(200);
    expect(response.text).toContain("<title>Ganga Technocast - IC</title>");
    expect(response.text).toContain("Investment Casting");
  });

  test("GET /contact should return status code 200 and render the projects page with correct data", async () => {
    const response = await request(app).get("/contact");
    expect(response.status).toBe(200);
    expect(response.text).toContain(
      "<title>Ganga Technocast - Contact</title>"
    );
    expect(response.text).toContain(
      "<p>7QMM+QR2, Amin marg, Road, Amrut Park, </p> <p> Kotecha Nagar, Rajkot, Gujarat 360001, India</p>"
    );

    expect(response.text).toContain(
      '<form id="contact_us" class="php-email-form" action="/contact-us" method="post">'
    );
  });

  test("GET /blog should return status code 200 and render the projects page with correct data", async () => {
    const response = await request(app).get("/blog");
    expect(response.status).toBe(200);
    expect(response.text).toContain("<title>Ganga Technocast - Blog</title>");
  });

  test("GET /blog_view should return status code 302 and render the projects page with correct data", async () => {
    const response = await request(app).get("/blog_view");
    expect(response.status).toBe(302); // redirect code
    expect(response.text).toContain("Found. Redirecting to /blog");
  });

  test("GET /admin should return status code 302 and render the projects page with correct data", async () => {
    const response = await request(app).get("/admin");
    expect(response.status).toBe(302); // redirect code
    expect(response.text).toContain("Found. Redirecting to /login");
  });

  test("GET /admin should return status code 302 and render the projects page with correct data", async () => {
    const response = await request(app).post("/admin");
    expect(response.status).toBe(302); // redirect code
    expect(response.text).toContain("Found. Redirecting to /login");
  });

  test("GET /blogpost should return status code 302 and render the projects page with correct data", async () => {
    const response = await request(app).post("/blogpost");
    expect(response.status).toBe(302); // redirect code
    expect(response.text).toContain("Found. Redirecting to /login");
  });

  test("GET /login should return status code 200 and render the projects page with correct data", async () => {
    const response = await request(app).get("/login");
    expect(response.status).toBe(200); // redirect code
    expect(response.text).toContain("<title>Ganga Technocast - Login</title>");
    expect(response.text).toContain('<form method="post" action="/login">');
  });

  test("GET /login should return status code 302 and render the projects page with correct data", async () => {
    const response = await request(app).post("/login");
    expect(response.status).toBe(302); // redirect code
    expect(response.text).toContain(
      "Found. Redirecting to /login?error=Firebase%3A%20Error%20(auth%2Fmissing-email)."
    );
  });

  test("GET /logout should return status code 302 and render the projects page with correct data", async () => {
    const response = await request(app).get("/logout");
    expect(response.status).toBe(302); // redirect code
    expect(response.text).toContain("Found. Redirecting to /login");
  });
});
