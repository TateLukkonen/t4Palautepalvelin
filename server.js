import express from "express";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

// Palaute-data REST-apia varten
import feedback from "./feedback_mock.json" with { type: "json" };

const __filename = fileURLToPath(import.meta.url); // get the resolved path to the file
const __dirname = path.dirname(__filename); // get the name of the directory

const host = "localhost";
const port = 3000;

const app = express();

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "templates"));

app.use("/styles", express.static("includes/styles"));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Polkumäärittelyt ejs-sivupohjia käyttäville web-sivuille
app.get("/", (req, res) => {
  res.render("index");
});
app.get("/palautelomake", (req, res) => {
  res.render("palaute");
});
app.post("/palautelomake", async (req, res) => {
  let name = req.body.name;
  let email = req.body.email;
  let feedback = req.body.feedback;

  fs.readFile("data.json", "utf8", function (err, dataString) {
    if (err) {
      console.log("ERR: Palaute-datan lukeminen epäonnistui");
    } else {
      let data = [];
      try {
        data = JSON.parse(dataString);
        if (!Array.isArray(data)) {
          data = [];
          throw new TypeError("Data not an array");
        }
      } catch (error) {
        console.log("ERR: Palaute-datan lukeminen epäonnistui");
        console.log(error);
      }

      data.push({
        name: name,
        email: email,
        feedback: feedback,
      });

      fs.writeFile(
        "data.json",
        JSON.stringify(data),
        { encoding: "utf8" },
        (err) => {
          if (err) {
            console.log("ERR: Palaute-datan tallettaminen epäonnistui");
          } else {
            console.log("OK:  Palaute-datan tallettaminen onnistui");
          }
        },
      );

      res.render("vastaus", { name: name, email: email });
    }
  });
});

// REST-palvelimen polut
app.get("/palaute/", (req, res) => {
  // Palauttaa kaikki palautteet
  res.json(feedback);
});
app.get("/palaute/:id", (req, res) => {
  const id = Number(req.params.id);
  const palaute = feedback.find((p) => p.id === id);

  if (!palaute) {
    return res.status(400).json({ error: "Palaute ei löytynyt" });
  }

  res.json(palaute);
});
app.post("/palaute/uusi", (req, res) => {
  const { name, email, feedback: text } = req.body;

  if (!name || !email || !text) {
    return res.status(400).json({ error: "jotain puuttuu" });
  }

  const uusi = {
    id: feedback.length > 0 ? feedback[feedback.length - 1].id + 1 : 1,
    name,
    email,
    feedback: text,
  };

  feedback.push(uusi);
  res.status(200).json(uusi);
});

app.put("/palaute/:id", (req, res) => {
  const id = Number(req.params.id);
  const { name, email, feedback } = req.body;

  const palaute = palautteet.find((p) => p.id === id);

  if (!palaute) {
    return res.status(400).json({ error: "Palaute ei löytynyt" });
  }

  if (name) palaute.name = name;
  if (email) palaute.email = email;
  if (feedback) palaute.feedback = feedback;

  res.status(200).json(palaute);
});

app.delete("/palaute/:id", (req, res) => {
  const id = Number(req.params.id);
  const index = palautteet.findIndex((p) => p.id === id);

  if (index === -1) {
    return res.status(400).json({ error: "Palaute ei löytynyt" });
  }

  const poistettu = palautteet.splice(index, 1)[0];
  res.status(200).json(poistettu);
});

// Aina viimeisenä palvelimen käynnistys
app.listen(port, host, () => console.log(`${host}:${port} kuuntelee...`));

//a
