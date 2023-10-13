import data from './data/data.json' assert { type: "json" };

const testInput = await fetch("/input.txt", {
        method: "GET",
        headers: {
            "Content-Type": "text/plain",
        },
    })
    .then((response) => response.text());

const DATA_SOURCE = {
    combined: -1,
    male: 0,
    female: 1,
};

function getData(key, dataSource) {
    if (dataSource == DATA_SOURCE.male)
        return data.male[key];
    else if (dataSource == DATA_SOURCE.female)
        return data.female[key];
    else {
        const male = data.male[key];
        const female = data.female[key];

        let combined = {
            x: 0,
            y: 0,
        };

        if (male !== undefined && male.x !== undefined && male.y !== undefined) {
            combined.x += male.x;
            combined.y += male.y;
        }

        if (female !== undefined && female.x !== undefined && female.y !== undefined) {
            combined.x += female.x;
            combined.y += female.y;
        }

        combined.x /= 2;
        combined.y /= 2;

        return combined;
    }
}

function calculatePoliticalOrientation(input, dataSource) {

}

calculatePoliticalOrientation(testInput, DATA_SOURCE.male);
