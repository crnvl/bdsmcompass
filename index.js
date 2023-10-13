const [
    data,
    map,
] = await Promise.all([
    fetch("/sbdmcompass/data/data.json", {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
        },
    })
        .then((response) => response.json()),
    fetch("/sbdmcompass/data/map.json", {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
        },
    })
        .then((response) => response.json()),
]);

const DATA_SOURCE = {
    combined: -1,
    male: 0,
    female: 1,
};

const MALE_XY_MAX = {
    x: Math.abs(Object.values(data.male).sort((a, b) => a.x - b.x)[0].x),
    y: Math.abs(Object.values(data.male).sort((a, b) => a.y - b.y)[0].y)
};

const FEMALE_XY_MAX = {
    x: Math.abs(Object.values(data.female).sort((a, b) => a.x - b.x)[0].x),
    y: Math.abs(Object.values(data.female).sort((a, b) => a.y - b.y)[0].y)
};

function normalize(data, max) {
    const x = data.x / max.x;
    const y = data.y / max.y;

    return {
        x,
        y,
    };
}

function getData(key, dataSource) {
    if (dataSource == DATA_SOURCE.male) {
        const _data = data.male[key];
        if (_data == null) {
            return null;
        }

        return normalize(_data, MALE_XY_MAX);
    }
    else if (dataSource == DATA_SOURCE.female) {
        const _data = data.female[key];
        if (_data == null) {
            return null;
        }

        return normalize(_data, FEMALE_XY_MAX);
    }
    else {
        const male = data.male[key];
        const female = data.female[key];

        let combined = {
            x: 0,
            y: 0,
        };

        if (male !== undefined && male.x !== undefined && male.y !== undefined) {
            const _male = normalize(male, MALE_XY_MAX);
            combined.x += _male.x;
            combined.y += _male.y;
        }

        if (female !== undefined && female.x !== undefined && female.y !== undefined) {
            const _female = normalize(female, FEMALE_XY_MAX);
            combined.x += _female.x;
            combined.y += _female.y;
        }

        combined.x /= 2;
        combined.y /= 2;

        return combined;
    }
}

function extractDataFromLine(line) {
    const regex = /(\d+)% (.*)/;

    const result = regex.exec(line);
    if (result == null) {
        return null;
    }

    const percentage = Number.parseInt(result[1]) * 0.01;
    const name = result[2];

    return {
        percentage,
        name,
    };
}

function calculatePoliticalOrientation(input, dataSource) {
    const mapEntries = Object.entries(map).map(([k, v]) => [k.toLowerCase(), v]);

    let pol_or = {
        x: 0,
        y: 0,
    };
    let num = 0;

    let vanilla = 0;
    for (const line of input.split("\n")) {
        const bdsmTestData = extractDataFromLine(line);
        if (bdsmTestData == null) {
            continue;
        }

        if (bdsmTestData.percentage == 0) {
            continue;
        }

        const key = bdsmTestData.name.toLowerCase();
        if (key.includes("vanilla")) {
            vanilla = bdsmTestData.percentage;
        }

        const _mapData = mapEntries.find(([k, v]) => k.includes(key) || key.includes(k));
        if (_mapData == null) {
            continue;
        }
        const [_, mapData] = _mapData;

        const dataEntries = Object.entries(mapData);
        for (const [dataName, dataModifier] of dataEntries) {
            const data = getData(dataName, dataSource);
            if (data == null) {
                continue;
            }

            pol_or.x += data.x * dataModifier * bdsmTestData.percentage;
            pol_or.y += data.y * dataModifier * bdsmTestData.percentage;

            num++;
        }
    }

    if (num == 0) {
        return null;
    }

    pol_or.x /= num;
    pol_or.y /= num;

    pol_or.x *= 1 - vanilla + 1;
    pol_or.y *= 1 - vanilla + 1;

    pol_or.x = Math.min(1, Math.max(-1, pol_or.x));
    pol_or.y = Math.min(1, Math.max(-1, pol_or.y));

    return pol_or;
}

function drawCompass(pos) {
    // draw political compass
    const canvas = document.getElementById('political-compass');

    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // fully white background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const width = canvas.width;
    const height = canvas.height;

    // draw fields
    const drawRect = function (x, y, w, h, color) {
        // 25% opacity
        this.fillStyle = color + '40';
        this.fillRect(x, y, w, h);
    }

    drawRect.call(ctx, 0, 0, width / 2, height / 2, '#ff0000');
    drawRect.call(ctx, width / 2, 0, width / 2, height / 2, '#0000ff');
    drawRect.call(ctx, 0, height / 2, width / 2, height / 2, '#00ff00');
    drawRect.call(ctx, width / 2, height / 2, width / 2, height / 2, '#ffff00');

    // draw lines
    const drawLine = function (x1, y1, x2, y2, color) {
        this.beginPath();
        this.moveTo(x1, y1);
        this.lineTo(x2, y2);
        this.strokeStyle = color;
        this.stroke();
    }

    drawLine.call(ctx, width / 2, 0, width / 2, height, '#000');
    drawLine.call(ctx, 0, height / 2, width, height / 2, '#000');

    // draw grid lines
    const drawGridLine = function (x1, y1, x2, y2, color) {
        this.beginPath();
        this.moveTo(x1, y1);
        this.lineTo(x2, y2);
        this.strokeStyle = color + '2';
        this.stroke();
    }

    const amount = 20;
    for (let i = 0; i < amount; i++) {
        drawGridLine.call(ctx, 0, i * height / amount, width, i * height / amount, '#000');
        drawGridLine.call(ctx, i * width / amount, 0, i * width / amount, height, '#000');
    }

    // draw text
    const drawText = function (text, x, y, color) {
        this.fillStyle = color;
        this.font = '32px Arial';
        this.fillText(text, x, y);
    }

    drawText.call(ctx, 'Left', 10, height / 2 - 10, '#000');
    drawText.call(ctx, 'Right', width - 80, height / 2 - 10, '#000');
    drawText.call(ctx, 'Authoritarian', width / 2 - 90, 50, '#000');
    drawText.call(ctx, 'Libertarian', width / 2 - 74, height - 10, '#000');

    // draw watermark text
    const drawWatermark = function (text, x, y, color) {
        this.fillStyle = color;
        this.font = '20px Arial';
        this.fillText(text, x, y);
    }

    drawWatermark.call(ctx, 'politicalbdsm.org', 10, height - 10, '#000');

    // draw point
    const drawPoint = function (x, y, radius, color) {
        this.beginPath();
        this.arc(x, y, radius, 0, 2 * Math.PI);
        this.fillStyle = color;
        this.fill();
    }

    

    const normalized_x = ((pos.x + 1) / 2) * width;
    const normalized_y = ((pos.y * -1 + 1) / 2) * height;

    drawPoint.call(ctx, normalized_x, normalized_y, 30, '#92B0FF' + '80');
    drawPoint.call(ctx, normalized_x, normalized_y, 12, '#5282FE');

    document.getElementById('results').style.display = 'flex'
}

function onSubmit(event) {
    event.preventDefault();

    const dataSource = DATA_SOURCE[document.getElementById("datapool").value];
    const input = document.getElementById("bdsm").value;

    const pol_or = calculatePoliticalOrientation(input, dataSource);

    drawCompass(pol_or)
}

document.getElementById("form").addEventListener("submit", onSubmit);
