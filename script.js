let requirements = [];
let descriptions = [];

/* =====================================
   NAVIGATION
===================================== */

function showTab(tabId) {

    document.getElementById("assessmentTab").style.display = "none";
    document.getElementById("adminTab").style.display = "none";
    document.getElementById("reportTab").style.display = "none";

    document.getElementById(tabId).style.display = "block";

}

/* =====================================
   CSV PARSER
===================================== */

function parseCSV(text) {

    const lines = text.trim().split("\n");

    const headers =
        lines[0]
        .split(",")
        .map(h => h.trim());

    const data = [];

    for (let i = 1; i < lines.length; i++) {

        const values =
            lines[i]
            .split(",")
            .map(v =>
                v.replace(/^"|"$/g, "").trim()
            );

        const row = {};

        headers.forEach((header, index) => {

            row[header] =
                values[index] || "";

        });

        data.push(row);

    }

    return data;

}

function populateAdminDropdowns() {

    const requirements =
        JSON.parse(
            localStorage.getItem("requirements")
        ) || [];

    const assessments =
        JSON.parse(
            localStorage.getItem("assessments")
        ) || [];

    const jobCodes =
        [...new Set(
            requirements.map(r => r.jobCode)
        )].sort();

    const teams =
        [...new Set(
            requirements.map(r => r.team)
        )].sort();

    const skills =
        [...new Set(
            requirements.map(r => r.skill)
        )].sort();

    const pms =
        [...new Set(
            assessments.map(a => a.pmName)
        )].sort();

    populateSelect("addJobCode", jobCodes);
    populateSelect("addTeam", teams);
    populateSelect("addSkill", skills);

    populateSelect("minJobCode", jobCodes);
    populateSelect("minTeam", teams);
    populateSelect("minSkill", skills);

    populateSelect("oldJobCode", jobCodes);
    populateSelect("jobTeam", teams);

    populateSelect("empName", pms);
    populateSelect("empCurrentJob", jobCodes);
    populateSelect("empTeam", teams);

}

function populateSelect(id, values) {

    const select =
        document.getElementById(id);

    if (!select) return;

    select.innerHTML =
        '<option value="">Select...</option>';

    values.forEach(value => {

        const option =
            document.createElement("option");

        option.value = value;
        option.textContent = value;

        select.appendChild(option);

    });

}

/* =====================================
   STARTUP
===================================== */

window.onload = async function () {

    await seedData();

    requirements =
        JSON.parse(
            localStorage.getItem("requirements")
        ) || [];

    descriptions =
        JSON.parse(
            localStorage.getItem("descriptions")
        ) || [];

    populateDropdowns();
    populateReportFilters();
    populateAdminDropdowns();

    document
        .getElementById("submitBtn")
        .addEventListener(
            "click",
            submitAssessment
        );

};

/* =====================================
   INITIAL DATA LOAD
===================================== */

async function seedData() {

    try {

        if (!localStorage.getItem("requirements")) {

            const response =
                await fetch("minReference.csv");

            const csvText =
                await response.text();

            const parsedData =
                parseCSV(csvText);

            localStorage.setItem(
                "requirements",
                JSON.stringify(parsedData)
            );

        }

        if (!localStorage.getItem("descriptions")) {

            localStorage.setItem(
                "descriptions",
                JSON.stringify(descriptionsData)
            );

        }

        if (!localStorage.getItem("assessments")) {

            localStorage.setItem(
                "assessments",
                JSON.stringify([])
            );

        }

    }

    catch (error) {

        console.error(error);

        alert(
            "Error loading startup data."
        );

    }

}

/* =====================================
   DROPDOWNS
===================================== */

function populateDropdowns() {

    const jobDropdown =
        document.getElementById("jobCode");

    const teamDropdown =
        document.getElementById("team");

    if (!jobDropdown || !teamDropdown) return;

    jobDropdown.innerHTML =
        '<option value="">Select Job Code</option>';

    teamDropdown.innerHTML =
        '<option value="">Select Team</option>';

    const jobs =
        [...new Set(
            requirements.map(r => r.jobCode)
        )].sort();

    const teams =
        [...new Set(
            requirements.map(r => r.team)
        )].sort();

    jobs.forEach(job => {

        const option =
            document.createElement("option");

        option.value = job;
        option.textContent = job;

        jobDropdown.appendChild(option);

    });

    teams.forEach(team => {

        const option =
            document.createElement("option");

        option.value = team;
        option.textContent = team;

        teamDropdown.appendChild(option);

    });

}

function populateReportFilters() {

    const assessments =
        JSON.parse(
            localStorage.getItem("assessments")
        ) || [];

    const teamDropdown =
        document.getElementById("reportTeam");

    const jobDropdown =
        document.getElementById("reportJobCode");

    const pmDropdown =
        document.getElementById("reportPM");

    teamDropdown.innerHTML =
        '<option value="">All Teams</option>';

    jobDropdown.innerHTML =
        '<option value="">All Job Codes</option>';

    pmDropdown.innerHTML =
        '<option value="">All PMs</option>';

    [...new Set(
        assessments.map(a => a.team)
    )].forEach(team => {

        teamDropdown.innerHTML +=
            `<option>${team}</option>`;

    });

    [...new Set(
        assessments.map(a => a.jobCode)
    )].forEach(job => {

        jobDropdown.innerHTML +=
            `<option>${job}</option>`;

    });

    [...new Set(
        assessments.map(a => a.pmName)
    )].forEach(pm => {

        pmDropdown.innerHTML +=
            `<option>${pm}</option>`;

    });

}
/* =====================================
   CURRENT SCORE LOOKUP
===================================== */

function getCurrentScore(
    pmName,
    jobCode,
    team,
    skill,
    subSkill
) {

    const assessments =
        JSON.parse(
            localStorage.getItem("assessments")
        ) || [];

    const match =
        assessments.find(a =>

            a.pmName === pmName &&
            a.jobCode === jobCode &&
            a.team === team &&
            a.skill === skill &&
            a.subSkill === subSkill

        );

    return match
        ? match.score
        : "";

}

/* =====================================
   LOAD SKILLS
===================================== */

function loadSkills() {

    const pmName =
        document.getElementById("pmName").value;

    const jobCode =
        document.getElementById("jobCode").value;

    const team =
        document.getElementById("team").value;

    if (!pmName) {

        alert("Enter PM Name");
        return;

    }

    if (!jobCode || !team) {

        alert("Select Job Code and Team");
        return;

    }

    const rows =
        requirements.filter(r =>

            r.jobCode === jobCode &&
            r.team === team

        );

    const tbody =
        document.querySelector(
            "#assessmentTable tbody"
        );

    tbody.innerHTML = "";

    rows.forEach(r => {

        const currentScore =
            getCurrentScore(
                pmName,
                jobCode,
                team,
                r.skill,
                r.subSkill
            );

        tbody.innerHTML += `

            <tr>

                <td>${r.skill}</td>

                <td>${r.subSkill}</td>

                <td>${r.minValue}</td>

                <td>${currentScore}</td>

                <td>
                    <input
                        type="number"
                        min="1"
                        max="5"
                        class="scoreInput">
                </td>

            </tr>

        `;

    });

    loadDescriptions(rows);

}

/* =====================================
   LOAD DESCRIPTIONS
===================================== */

function loadDescriptions(rows) {

    const panel =
        document.getElementById("descriptions");

    if (!panel) return;

    panel.innerHTML = "";

    const uniqueSkills =
        [...new Set(
            rows.map(r => r.skill)
        )];

    uniqueSkills.forEach(skill => {

        const desc =
            descriptions.find(
                d => d.skill === skill
            );

        panel.innerHTML += `

            <div class="descriptionCard">

                <h3>${skill}</h3>

                <p>
                    ${desc ? desc.description : ""}
                </p>

            </div>

        `;

    });

}

/* =====================================
   SAVE / UPDATE ASSESSMENT
===================================== */

function submitAssessment() {

    const pmName =
        document.getElementById("pmName").value;

    const jobCode =
        document.getElementById("jobCode").value;

    const team =
        document.getElementById("team").value;

    let assessments =
        JSON.parse(
            localStorage.getItem("assessments")
        ) || [];

    const rows =
        document.querySelectorAll(
            "#assessmentTable tbody tr"
        );

    rows.forEach(row => {

        const skill =
            row.cells[0].innerText;

        const subSkill =
            row.cells[1].innerText;

        const score =
            row.cells[4]
                .querySelector("input")
                .value;

        if (score !== "") {

            const existing =
                assessments.find(a =>

                    a.pmName === pmName &&
                    a.jobCode === jobCode &&
                    a.team === team &&
                    a.skill === skill &&
                    a.subSkill === subSkill

                );

            if (existing) {

                existing.score = score;

            }

            else {

                assessments.push({
                    pmName,
                    jobCode,
                    team,
                    skill,
                    subSkill,
                    score
                });

            }

        }

    });

localStorage.setItem(
    "assessments",
    JSON.stringify(assessments)
);

populateReportFilters();

const reportTab =
    document.getElementById("reportTab");

if (
    reportTab &&
    reportTab.style.display !== "none"
) {
    buildReport();
}

document
    .querySelectorAll(".scoreInput")
    .forEach(input => input.value = "");

alert("Assessment Saved Successfully");

loadSkills();

}

/* =====================================
   ADD SKILL / SUBSKILL
===================================== */

function addSkillSubskill() {

    let requirements =
        JSON.parse(
            localStorage.getItem("requirements")
        ) || [];

    const jobCode =
        document.getElementById("addJobCode").value;

    const team =
        document.getElementById("addTeam").value;

    const skill =
        document.getElementById("addSkill").value;

    const subSkill =
        document.getElementById("addSubskill").value;

    const minValue =
        document.getElementById("addMinimum").value;

    if (
        !jobCode ||
        !team ||
        !skill ||
        !subSkill ||
        !minValue
    ) {

        alert("Please complete all fields.");
        return;

    }

    const exists =
        requirements.some(r =>

            r.jobCode === jobCode &&
            r.team === team &&
            r.skill === skill &&
            r.subSkill === subSkill

        );

    if (exists) {

        alert("This Skill/Subskill already exists.");
        return;

    }

    requirements.push({
        jobCode,
        team,
        skill,
        subSkill,
        minValue
    });

    localStorage.setItem(
        "requirements",
        JSON.stringify(requirements)
    );

    window.requirements = requirements;

    populateDropdowns();
    populateReportFilters();
    populateAdminDropdowns();

    alert("Skill Added");

}

/* =====================================
   UPDATE MINIMUM
===================================== */

function updateMinimum() {

    let requirements =
        JSON.parse(
            localStorage.getItem("requirements")
        ) || [];

    requirements.forEach(r => {

        if (

            r.jobCode ===
            document.getElementById("minJobCode").value &&

            r.team ===
            document.getElementById("minTeam").value &&

            r.skill ===
            document.getElementById("minSkill").value

        ) {

            r.minValue =
                document.getElementById("newMinimum").value;

        }

    });

    localStorage.setItem(
        "requirements",
        JSON.stringify(requirements)
    );

    window.requirements = requirements;

    alert("Minimum Updated");

}

/* =====================================
   GLOBAL JOB CODE CHANGE
===================================== */

function changeJobCode() {

    let requirements =
        JSON.parse(
            localStorage.getItem("requirements")
        ) || [];

    let assessments =
        JSON.parse(
            localStorage.getItem("assessments")
        ) || [];

    const oldCode =
        document.getElementById("oldJobCode").value;

    const newCode =
        document.getElementById("newJobCode").value;

    const team =
        document.getElementById("jobTeam").value;

    requirements.forEach(r => {

        if (
            r.jobCode === oldCode &&
            r.team === team
        ) {

            r.jobCode = newCode;

        }

    });

    assessments.forEach(a => {

        if (
            a.jobCode === oldCode &&
            a.team === team
        ) {

            a.jobCode = newCode;

        }

    });

    localStorage.setItem(
        "requirements",
        JSON.stringify(requirements)
    );

    localStorage.setItem(
        "assessments",
        JSON.stringify(assessments)
    );

    window.requirements = requirements;

    populateDropdowns();
    populateReportFilters();
    populateAdminDropdowns();

    alert("Job Code Updated");

}

/* =====================================
   EMPLOYEE JOB CODE CHANGE
===================================== */

function changeEmployeeJobCode() {

    let assessments =
        JSON.parse(
            localStorage.getItem("assessments")
        ) || [];

    assessments.forEach(a => {

        if (

            a.pmName ===
            document.getElementById("empName").value &&

            a.jobCode ===
            document.getElementById("empCurrentJob").value &&

            a.team ===
            document.getElementById("empTeam").value

        ) {

            a.jobCode =
                document.getElementById("empNewJob").value;

        }

    });

    localStorage.setItem(
        "assessments",
        JSON.stringify(assessments)
    );

    populateReportFilters();

    alert("Employee Updated");

}

/* =====================================
   REPORT
===================================== */

function buildReport() {

    const assessments =
        JSON.parse(
            localStorage.getItem("assessments")
        ) || [];

    const requirements =
        JSON.parse(
            localStorage.getItem("requirements")
        ) || [];

    const reportContainer =
        document.getElementById(
            "reportResults"
        );

    const selectedTeam =
        document.getElementById("reportTeam").value;

    const selectedJobCode =
        document.getElementById("reportJobCode").value;

    const selectedPM =
        document.getElementById("reportPM").value;

    const filteredAssessments =
        assessments.filter(a =>

            (selectedTeam === "" ||
                a.team === selectedTeam)

            &&

            (selectedJobCode === "" ||
                a.jobCode === selectedJobCode)

            &&

            (selectedPM === "" ||
                a.pmName === selectedPM)

        );

    if (filteredAssessments.length === 0) {

        reportContainer.innerHTML =
            "<h3>No assessments found.</h3>";

        return;

    }

    const uniquePMs =
        [...new Set(
            filteredAssessments.map(
                a => a.pmName
            )
        )];

    const uniqueTeams =
        [...new Set(
            filteredAssessments.map(
                a => a.team
            )
        )];

    let totalScore = 0;

    filteredAssessments.forEach(a => {

        totalScore += Number(a.score);

    });

    const avgScore =
        (
            totalScore /
            filteredAssessments.length
        ).toFixed(2);

    let html = `

        <div class="reportCards">

            <div class="card">
                <h3>Total Assessments</h3>
                <p>${filteredAssessments.length}</p>
            </div>

            <div class="card">
                <h3>Total PMs</h3>
                <p>${uniquePMs.length}</p>
            </div>

            <div class="card">
                <h3>Total Teams</h3>
                <p>${uniqueTeams.length}</p>
            </div>

            <div class="card">
                <h3>Average Score</h3>
                <p>${avgScore}</p>
            </div>

        </div>

    `;

    /* ==========================
       PM SUMMARY
    ========================== */

    html += `

        <h2>PM Summary</h2>

        <table>

            <thead>

                <tr>

                    <th>PM</th>
                    <th>Team</th>
                    <th>Average Actual</th>
                    <th>Average Minimum</th>
                    <th>Gap</th>
                    <th>Status</th>

                </tr>

            </thead>

            <tbody>

    `;

    uniquePMs.forEach(pm => {

        const pmRows =
            filteredAssessments.filter(
                a => a.pmName === pm
            );

        const team =
            pmRows[0].team;

        let totalActual = 0;
        let totalMinimum = 0;

        pmRows.forEach(row => {

            totalActual +=
                Number(row.score);

            const match =
                requirements.find(r =>

                    r.jobCode === row.jobCode &&
                    r.team === row.team &&
                    r.skill === row.skill &&
                    r.subSkill === row.subSkill

                );

            if (match) {

                totalMinimum +=
                    Number(match.minValue);

            }

        });

        const avgActual =
            totalActual /
            pmRows.length;

        const avgMinimum =
            totalMinimum /
            pmRows.length;

        const gap =
            avgActual -
            avgMinimum;

        const status =
            avgActual >= avgMinimum
                ? "✅ Meets"
                : "🔴 Below";

        html += `

            <tr>

                <td>${pm}</td>

                <td>${team}</td>

                <td>
                    ${avgActual.toFixed(2)}
                </td>

                <td>
                    ${avgMinimum.toFixed(2)}
                </td>

                <td>
                    ${gap.toFixed(2)}
                </td>

                <td>${status}</td>

            </tr>

        `;

    });

    html += `
            </tbody>
        </table>
    `;

    /* ==========================
       SKILL GAP ANALYSIS
    ========================== */

    html += `

        <br>

        <h2>Skill Gap Analysis</h2>

        <table>

            <thead>

                <tr>

                    <th>PM</th>
                    <th>Team</th>
                    <th>Skill</th>
                    <th>Subskill</th>
                    <th>Actual</th>
                    <th>Minimum</th>
                    <th>Gap</th>
                    <th>Status</th>

                </tr>

            </thead>

            <tbody>

    `;

    filteredAssessments.forEach(a => {

        const match =
            requirements.find(r =>

                r.jobCode === a.jobCode &&
                r.team === a.team &&
                r.skill === a.skill &&
                r.subSkill === a.subSkill

            );

        const minimum =
            match
                ? Number(match.minValue)
                : 0;

        const actual =
            Number(a.score);

        const gap =
            actual - minimum;

        const status =
            actual >= minimum
                ? "✅ Meets"
                : "🔴 Below";

        html += `

            <tr>

                <td>${a.pmName}</td>

                <td>${a.team}</td>

                <td>${a.skill}</td>

                <td>${a.subSkill}</td>

                <td>${actual}</td>

                <td>${minimum}</td>

                <td>${gap}</td>

                <td>${status}</td>

            </tr>

        `;

    });

    html += `
            </tbody>
        </table>
    `;

    /* ==========================
       TEAM SUMMARY
    ========================== */

    html += `

        <br>

        <h2>Team Summary</h2>

        <table>

            <thead>

                <tr>

                    <th>Team</th>
                    <th>Average Actual</th>
                    <th>Average Minimum</th>
                    <th>Gap</th>

                </tr>

            </thead>

            <tbody>

    `;

    uniqueTeams.forEach(team => {

        const teamRows =
            filteredAssessments.filter(
                a => a.team === team
            );

        let totalActual = 0;
        let totalMinimum = 0;

        teamRows.forEach(row => {

            totalActual +=
                Number(row.score);

            const match =
                requirements.find(r =>

                    r.jobCode === row.jobCode &&
                    r.team === row.team &&
                    r.skill === row.skill &&
                    r.subSkill === row.subSkill

                );

            if (match) {

                totalMinimum +=
                    Number(match.minValue);

            }

        });

        const avgActual =
            totalActual /
            teamRows.length;

        const avgMinimum =
            totalMinimum /
            teamRows.length;

        const gap =
            avgActual -
            avgMinimum;

        html += `

            <tr>

                <td>${team}</td>

                <td>
                    ${avgActual.toFixed(2)}
                </td>

                <td>
                    ${avgMinimum.toFixed(2)}
                </td>

                <td>
                    ${gap.toFixed(2)}
                </td>

            </tr>

        `;

    });

    html += `
            </tbody>
        </table>
    `;

    reportContainer.innerHTML = html;

}

/* =====================================
   EXPORT
===================================== */

function exportAssessments() {

    const assessments =
        JSON.parse(
            localStorage.getItem("assessments")
        ) || [];

    const requirements =
        JSON.parse(
            localStorage.getItem("requirements")
        ) || [];

    if (assessments.length === 0) {

        alert("No assessments found.");
        return;

    }

    const exportData =
        assessments.map(a => {

            const requirement =
                requirements.find(r =>

                    r.jobCode === a.jobCode &&
                    r.team === a.team &&
                    r.skill === a.skill &&
                    r.subSkill === a.subSkill

                );

            const minimum =
                requirement
                    ? Number(requirement.minValue)
                    : "";

            const actual =
                Number(a.score);

            const gap =
                minimum === ""
                    ? ""
                    : actual - minimum;

            const status =
                minimum === ""
                    ? "Missing Requirement"
                    : actual >= minimum
                        ? "Meets"
                        : "Below";

            return {

                pmName: a.pmName,
                jobCode: a.jobCode,
                team: a.team,
                skill: a.skill,
                subSkill: a.subSkill,
                score: a.score,
                minimumRequirement: minimum,
                gap: gap,
                status: status

            };

        });

    const headers =
        Object.keys(exportData[0]);

    const rows = [

        headers.join(","),

        ...exportData.map(row =>

            headers
                .map(h => row[h])
                .join(",")

        )

    ];

    const blob =
        new Blob(
            [rows.join("\n")],
            {
                type: "text/csv"
            }
        );

    const url =
        URL.createObjectURL(blob);

    const a =
        document.createElement("a");

    a.href = url;
    a.download = "assessments.csv";

    a.click();

}

/* =====================================
   RESET
===================================== */

function clearAllData() {

    if (
        confirm(
            "Delete all locally stored data?"
        )
    ) {

        localStorage.clear();
        location.reload();

    }

}