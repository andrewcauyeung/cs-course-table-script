var allCourseDict = {};
var courseDict = {};
var currentSemester = "";
var currentYear = "";
var enumDict = {
  Spring: 1,
  Summer: 2,
  Fall: 3,
  Winter: 4,
  1: "Spring",
  2: "Summer",
  3: "Fall",
  4: "Winter"
};

$(document).ready(function() {
  function submitFile() {
    document.getElementById("input").files;
    currentSemester = document.getElementById("semester-select").value + " ";
    document.getElementById("year-select").value;
    currentYear = document.getElementById("year-select").value;
    var count = document.getElementById("input").files.length;
    for (var i = 0; i < document.getElementById("input").files.length; i++) {
      readFile(
        document.getElementById("input").files[i],
        document.getElementById("input").files[i]["name"]
      );
    }
    function readFile(event, filename) {
      var reader = new FileReader();
      reader.onload = function(event) {
        var temp = event.target.result;
        console.log(event.target.result);
        if (filename.includes("current-courses.json")) {
          var json = JSON.parse(event.target.result);
          console.log(json);
          allCourseDict["current"] = parseJson(json);
        } else if (filename.includes("new-courses.csv")) {
          temp = $.csv2Dictionary(temp);
          console.log(temp);
          allCourseDict["new"] = parseCSV(temp);
        }
        if (!--count) {
          console.log(allCourseDict);
          appendCard("Updated CS Courses", "generateCSV()", "courses");
          crossReference(allCourseDict);
          //generateCSV(allCourseDict);
        }
      };
      reader.readAsText(event);
    }
  }
  document.getElementById("file-submit").addEventListener("click", submitFile);
});

function parseJson(json) {
  var courseDict = {};
  for (var i = 0; i < json.length; i++) {
    var temp = json[i];
    //Remove tags from the dictionary
    for (var x in temp) {
      temp[x] = temp[x].replace(/<(.|\n)*?>/g, "");
    }
    //CASE: CSE 190-192 CSE 340-342
    if (temp["Course Name"].includes("-")) {
      var range = temp["Course Name"].split("-");
      var low = parseInt(range[0].match(/\d+/g)[0], 10);
      var high = parseInt(range[range.length - 1].match(/\d+/g)[0], 10);
      var dept = range[0].match(/^[A-Za-z]+/g)[0];
      for (var y = low; y < high + 1; y++) {
        temp["Course Name"] = dept + y;
        courseDict[temp["Course Name"]] = temp;
      }
    } else {
      courseDict[temp["Course Name"]] = temp;
    }
  }
  console.log(courseDict);
  return courseDict;
}

function parseCSV(dictionary) {
  for (var i = 0; i < dictionary.length; i++) {
    var currentDict = dictionary[i];
    var tempDict = {};
    for (var x in currentDict) {
      tempDict[x] = currentDict[x];
    }
    // if (/(19[0-2])/.test(currentDict["Number"])) {
    //   courseDict["CSE190-192"] = tempDict;
    // } else {
    courseDict[currentDict["Subj"] + currentDict["Number"]] = tempDict;
    // }
  }
  console.log(courseDict);
  return courseDict;
}

function crossReference() {
  var updatedDict = {};
  var newCourses = {};
  for (key in allCourseDict["new"]) {
    if (key in allCourseDict["current"]) {
      updatedDict[key] = allCourseDict["current"][key];
    } else if (key.includes("190", "191", "192")) {
      updatedDict["CSE190-192"] = allCourseDict["current"]["CSE190-192"];
    } else {
      var temp = {
        "Course Name": key,
        "Course Description": allCourseDict["new"][key]["Course Title"]
      };
      newCourses[key] = temp;
    }
  }
  console.log(updatedDict);
  allCourseDict["new-col"] = updatedDict;
  console.log(newCourses);
}

function generateCSV() {
  var csvArr = [
    "",
    "Department",
    "Course Number",
    "Course Id",
    "Course Name",
    "Course Description",
    "Semester 0",
    "Semester 1",
    "Semester 2",
    "Semester 3",
    "Semester 4\n"
  ];

  var oldestSemester = getOldestSemester();

  for (var key in allCourseDict["current"]) {
    var department = allCourseDict["current"][key]["Course Name"].match(
      /^[A-Za-z]+/g
    )[0];

    var numArr = allCourseDict["current"][key]["Course Name"].match(/\d+/g);
    var number = numArr[0];
    for (var i = 1; i < numArr.length; i++) {
      number = number + "-" + numArr[i];
    }

    var courseId = allCourseDict["current"][key]["Course Name"] + "ROW";

    var courseName = allCourseDict["current"][key]["Course Name"];

    var description = '"' + allCourseDict["current"][key]["Course Title"] + '"';

    var row = [department, number, courseId, courseName, description];

    //Orders the semester from oldest to newest
    var ordering = [];
    for (var x in allCourseDict["current"][key]) {
      var temp = x.match(/^[A-Za-z]+/g)[0];
      //Check for the Semesters
      if (temp in enumDict) {
        var tempYear = x.match(/\d+/g);
        var num = enumDict[temp];
        var sortableNum = parseInt(tempYear, 10) + num * 0.1;
        ordering.push(sortableNum);
      }
    }
    ordering.sort(function(a, b) {
      return a - b;
    });
    console.log(ordering);

    //Set semesters
    for (var i = 1; i < ordering.length; i++) {
      var year = ordering[i].toString(10).split(".")[0];
      var month = ordering[i].toString(10).split(".")[1];
      var semester = enumDict[month] + " " + year;
      if (semester in allCourseDict["current"][key]) {
        var mark = allCourseDict["current"][key][semester];
        if (mark != "") {
          mark = "&#10004";
        }
        row.push(mark);
      }
    }

    //Set the updated Semester
    if (key in allCourseDict["new-col"]) {
      row.push("&#10004");
    } else {
      row.push("");
    }
    csvArr[csvArr.length - 1][row.length - 1] =
      csvArr[csvArr.length - 1][row.length - 1] + "\n";
    csvArr.push(row);
  }
  downloadHandler(csvArr, "courseUpdate.csv");
}

function getOldestSemester() {
  // var year = currentSemester.match(/\d+/g)[0];
  // var semester = currentSemester.match(/^[A-Za-z]+/g)[0];

  var enumOld = enumDict[currentSemester] - 4;
  var year = currentYear;
  if (enumOld < 0) {
    year = year - 1;
  }

  var oldestSemester = enumDict[enumOld] + " " + year;
  return oldestSemester;
}

/**
 * Download button handler for import files
 * @param {*} csvArr - array format of the csv to be uploaded
 * @param {*} filename - string of the filenaame
 * @param {*} tableSwitch
 */
function downloadHandler(csvArr, filename, tableSwitch) {
  var a = document.createElement("a");
  a.href = "data:text/csv;charset=utf-8," + encodeURIComponent(csvArr);
  a.target = "_blank";
  a.download = filename;

  document.body.appendChild(a);
  a.click();
}
