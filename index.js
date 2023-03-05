const express = require("express");
const app = express();
const fs = require("fs");
const Joi = require("joi");


const port = process.env.PORT || 5000;
app.listen(5000, () => {
  console.log("connected to port 5000"); 


//const students = require("./students.json");

app.use(express.json());

// READ
const studentsData = fs.readFileSync("./students.json");
const students = JSON.parse(studentsData);

//CRUD 

//Afficher tous les étudiants 
app.get("/students", (req, res) => {
  res.send(students.map((student) => student["nom"]));
});

// Ajouter un nouveau étudiant 
app.post("/students", (req, res) => {
  const schema = Joi.object({
    nom: Joi.string().required(),
    classe: Joi.string().required(),
    modules: Joi.array().items(
      Joi.object({
        module: Joi.string().required(),
        note: Joi.number().integer().min(0).max(20).required(),
      })
    ),
  });

  const result = schema.validate(req.body);

  if (result.error) {
    res.status(400).send(result.error.details[0].message);
    return;
  }

  const newStudent = req.body;
  newStudent.moyenne = calculMoyenne(newStudent.modules);
  students.push(newStudent);
  saveStudentsData(students);

  res.send(newStudent);
});



// Modifier les notes d'un étudiant 
app.put("/students/:nom", (req, res) => {
  const student = students.find((s) => s["nom"]=== req.params.nom);

  if (!student) {
    res.status(404).send("Étudiant non trouvé");
    return;
  }

  const schema = Joi.array().items(
    Joi.object({
      module: Joi.string().required(),
      note: Joi.number().integer().min(0).max(20).required(),
    })
  );

  const result = schema.validate(req.body);

  if (result.error) {
    res.status(400).send(result.error.details);
    return;
  }

  student["modules"] = req.body;
  student.moyenne = calculMoyenne(student.modules);
  saveStudentsData(students);

  res.send(student);
});

// Supprimer un étudiant (delete)
app.delete("/students/delete/:nom", (req, res) => {
  const studentIndex = students.findIndex((s) => s["nom"] === req.params.nom);

  if (studentIndex === -1) {
    res.status(404).send("Étudiant non trouvé");
    return;
  }
  students.splice(studentIndex, 1);
  saveStudentsData(students);

  res.send("Étudiant supprimé");
});



//Afficher chaque étudiant avec leur meilleure et leur moindre module

app.get("/students/Meilleure-Moindre/moy", (req, res) => {
  const MeillMoinNotes = students.map((student) => {
    const MeilleureNote = Math.max(...student.modules.map((m) => m["note"]));
    const MoindretNote = Math.min(...student.modules.map((m) => m["note"]));
    return {
      nom: student.nom,
      Meilleur: MeilleureNote,
      Moindre : MoindretNote,
    };
  });

  res.send(MeillMoinNotes);
});
//  Afficher la moyenne de tous les étudiants
app.get("/students/:nom/moyenne", (req, res) => {
    const totalModules = students.reduce((acc, student) => {
      return acc + student["modules"].length;
    }, 0);
  
    const totalNotes = students.reduce((acc, student) => {
      return (
        acc +
        student["modules"].reduce((acc, module) => {
          return acc + module["note"];
        }, 0)
      );
    }, 0);
  
    const moyenne = totalNotes / totalModules;
  
    res.send({ moyenne });
  });

//Calcul automatique de moyenne 

function calculMoyenne(modules) {
  const totalNotes = modules.reduce((acc, module) => {
    return acc + module["note"];
  }, 0);

  return totalNotes / modules.length;
}

function saveStudentsData(data) {
  fs.writeFileSync("./students.json", JSON.stringify(data));
}


  
});