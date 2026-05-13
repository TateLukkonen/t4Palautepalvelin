import express from "express";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

import feedback from "./feedback_mock.json" with { type: "json" };

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const host = "localhost";
const port = 3000;

const app = express();

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "templates"));

app.use("/styles", express.static("includes/styles"));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.get("/", (req, res) => {
  res.render("index");
});

app.get("/palautelomake", (req, res) => {
  res.render("palaute");
});

app.post("/palautelomake", (req, res) => {
  const name = req.body.name;
  const email = req.body.email;
  const feedbackText = req.body.feedback;

  fs.readFile("data.json", "utf8", (err, dataString) => {
    if (err) {
      console.log("ERR: Palaute-datan lukeminen epäonnistui");
      return res.status(500).send("Virhe palvelimella");
    }

    let data = [];

    try {
      data = JSON.parse(dataString);

      if (!Array.isArray(data)) {
        data = [];
      }
    } catch (error) {
      console.log("ERR: JSON parse epäonnistui");
      console.log(error);
      data = [];
    }

    data.push({
      name: name,
      email: email,
      feedback: feedbackText,
    });

    fs.writeFile(
      "data.json",
      JSON.stringify(data, null, 2),
      { encoding: "utf8" },
      (err) => {
        if (err) {
          console.log("ERR: Palaute-datan tallettaminen epäonnistui");
          return res.status(500).send("Tallennus epäonnistui");
        }

        console.log("OK: Palaute-datan tallettaminen onnistui");

        res.render("vastaus", {
          name: name,
          email: email,
        });
      },
    );
  });
});

app.get("/palaute", (req, res) => {
  res.json(feedback);
});

app.get("/palaute/:id", (req, res) => {
  const id = Number(req.params.id);

  const palaute = feedback.find((p) => p.id === id);

  if (!palaute) {
    return res.status(404).json({
      error: "Palaute ei löytynyt",
    });
  }

  res.json(palaute);
});

app.post("/palaute/uusi", (req, res) => {
  const { name, email, feedback: text } = req.body;

  if (!name || !email || !text) {
    return res.status(400).json({
      error: "Jotain puuttuu",
    });
  }

  const uusi = {
    id: feedback.length > 0 ? feedback[feedback.length - 1].id + 1 : 1,
    name,
    email,
    feedback: text,
  };

  feedback.push(uusi);

  res.status(201).json(uusi);
});

app.put("/palaute/:id", (req, res) => {
  const id = Number(req.params.id);

  const { name, email, feedback: feedbackText } = req.body;

  const palaute = feedback.find((p) => p.id === id);

  if (!palaute) {
    return res.status(404).json({
      error: "Palaute ei löytynyt",
    });
  }

  if (name) {
    palaute.name = name;
  }

  if (email) {
    palaute.email = email;
  }

  if (feedbackText) {
    palaute.feedback = feedbackText;
  }

  res.status(200).json(palaute);
});

app.delete("/palaute/:id", (req, res) => {
  const id = Number(req.params.id);

  const index = feedback.findIndex((p) => p.id === id);

  if (index === -1) {
    return res.status(404).json({
      error: "Palaute ei löytynyt",
    });
  }

  const poistettu = feedback.splice(index, 1)[0];

  res.status(200).json(poistettu);
});

app.listen(port, host, () => {
  console.log(`${host}:${port} kuuntelee...`);
});
