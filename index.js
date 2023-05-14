const express = require('express');
const app = express();
const path = require('path');
const multer = require('multer');
const mysql = require('mysql');
const fs = require('fs');
const nunjucks = require('nunjucks');
nunjucks.configure('chart', {
    autoescape: true,
    express: app
});

// 업로드 페이지를 렌더링하는 라우터
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'upload.html'));
});
// 서버 시작
app.listen(3000, () => {
    console.log('서버가 시작되었습니다.');
});
process.on('SIGINT', () => {
    console.log('서버가 종료됩니다.');
    connection.end();
    process.exit();
});

// MySQL connection 설정
const connection = mysql.createConnection(
    {host: 'localhost', user: 'root', password: '', database: ''}
);

// 파일 업로드를 위한 multer 설정
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname);
    }
});
const upload = multer({storage: storage});

//배열선언
let coretask_value = [[     //task1 에서 [core1], [core2], [core3], [core4], [core5]끼리 총 10개임
        [], [], [], [], []
    ], [                    //task2 에서 [core1], [core2], [core3], [core4], [core5]끼리
        [], [], [], [], []
    ], [                    //task3 에서 [core1], [core2], [core3], [core4], [core5]끼리
        [], [], [], [], []
    ], [                    //task4 에서 [core1], [core2], [core3], [core4], [core5]끼리
        [], [], [], [], []
    ], [                    //task5 에서 [core1], [core2], [core3], [core4], [core5]끼리
        [], [], [], [], []
    ]];
let coretask_result = [[
        [], [], [], [], []
    ], [
        [], [], [], [], []
    ], [
        [], [], [], [], []
    ], [
        [], [], [], [], []
    ], [
        [], [], [], [], []
    ]];

// 업로드된 파일을 처리하는 라우터 파일로 들어온 데이터 가공하고 DB에 저장
app.post('/upload', upload.single('userfile'), (req, res, next) => {
    // res.sendFile(path.join(__dirname, 'chart/main.html')); const file = req.file;
    // if (!file)     res.send('파일 불러오셈!!'); res.send('업로드 됨!!');

    const fileContent = fs.readFileSync('uploads/inputFile.txt', 'utf-8');
    const frows = fileContent
        .trim()
        .trim('\n')
        .split('\t')
        .filter(num => !isNaN(num))
        .filter(element => element !== '\n\n');

    const rows = [];
    const numColumns = 5;
    for (let i = 0; i < frows.length; i += numColumns) {
        const row = frows.slice(i, i + numColumns);
        rows.push(row);
    }

    // MySQL DB 연결     connection.connect((err) => {       if (err)           throw
    // err;       console.log('Connected to MySQL server~');   }); 전에 저장된 데이터들 삭제
    connection.query('DELETE FROM my_table', [rows]);

    // 삽입 쿼리 생성
    connection.query(
        'INSERT INTO my_table (task1, task2, task3, task4, task5) VALUES ?',
        [rows],
        (err) => {
            if (err) 
                throw err;
            console.log(`Inserted ${rows.length} rows.`);
        }
    );

    //데이터 베이스에서 데이터 가져오기
    connection.query(
        'SELECT task1, task2, task3, task4, task5 FROM my_table',
        (error, results, fields) => {
            if (error) 
                throw error;
            
            //데이터를 저장할 이차원 배열
            const data = [];
            //결과를 위해 배열에 저장
            for (let i = 0; i < results.length; i++) {
                const row = results[i];
                const rowData = [row.task1, row.task2, row.task3, row.task4, row.task5];
                data.push(rowData);
            }

            //이차원배열인 data배열을 일차원 배열로 복사하기
            let newdata = [];
            for (let i = 0; i < data.length; i++) {
                for (let j = 0; j < data[i].length; j++) {
                    newdata.push(data[i][j]);
                }
            }

            for (let j = 0; j < 10; j++) {
                let rearnew_data = newdata.slice(j * 25, j * 25 + 25);
                for (let i = 0; i < 25; i++) {
                    if (i % 5 === 0) {
                        coretask_value[parseInt(i / 5)][0].push(rearnew_data[i]);
                    }
                    if (i % 5 === 1) {
                        coretask_value[parseInt(i / 5)][1].push(rearnew_data[i]);
                    }
                    if (i % 5 === 2) {
                        coretask_value[parseInt(i / 5)][2].push(rearnew_data[i]);
                    }
                    if (i % 5 === 3) {
                        coretask_value[parseInt(i / 5)][3].push(rearnew_data[i]);
                    }
                    if (i % 5 === 4) {
                        coretask_value[parseInt(i / 5)][4].push(rearnew_data[i]);
                    }
                }
            }

            //coertask_result값 넣기
            for(let i = 0; i<5; i++){
                for(let j = 0; j<5; j++){
                    let a = Math.max.apply(null,coretask_value[i][j]);
                    let b = Math.min.apply(null, coretask_value[i][j]);
                    let c = avg(coretask_value[i][j]);
                    let d = standard_deviation(coretask_value[i][j]);
                    let e = median(coretask_value[i][j]);
                    coretask_result[i][j].push(a,b,c,d,e);
                }
            }
            console.log(coretask_result);


            //avg 평균 계산 함수
            function avg(arr1){
                let avg = 0;
                let sum = 0;
                for(let i = 0; i<arr1.length; i++){
                    sum+= parseInt(arr1[i]);
                }
                avg = sum/arr1.length;
                return Math.floor(avg);
            }

            //standard_deviation 표준편차 계산 함수
            function standard_deviation(arr1){
                let mean = avg(arr1);
                let total = 0;
                for(let i=0; i<arr1.length; i++){
                    let deviation = arr1[i] - mean;
                    total = deviation ** 2;
                }
                let a = Math.sqrt((total/(arr1.length-1)));
                return Math.floor(a);
            }

            //median 중앙값 계산 함수
            function median(arr1){

                arr1.sort(function(a,b){
                    return a-b;
                });

                return parseInt(arr1[4])
            }
            res.render('main.html', {data});
        }
    );

    fs.unlink('uploads/inputFile.txt', err => {
        if (err) 
            throw err;
        
        console.log('File is deleted.');
    });
});
//이 부분까지 inputFile.txt파일을 넣고 MySQL DB에 넣기 위한 과정!!!