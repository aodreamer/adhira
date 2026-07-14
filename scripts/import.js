const {Pool} = require("pg");
const XLSX=require("xlsx");

function norm(s){if(!s)return"";return String(s).trim().replace(/\s+/g," ");}

function splitJ(s){if(!s)return["",""];s=norm(s);var m=s.match(/\s+(?:pada|di)\s+/i);if(m)return[norm(s.slice(0,m.index)),norm(s.slice(m.index+m[0].length))];var lc=s.lastIndexOf(",");if(lc>0&&s.slice(lc+1).trim().length>10)return[norm(s.slice(0,lc)),norm(s.slice(lc+1))];return[s,""];}

async function run(){
var pool=new Pool({host:"db",port:5432,database:"adhira",user:"euser",password:"epass"});
var wb=XLSX.readFile("/app/data.xlsx");
var all={};
["Kepka","PETIKAN","Sheet2"].forEach(function(sn){
var rows=XLSX.utils.sheet_to_json(wb.Sheets[sn],{header:1});
console.log(sn+": "+(rows.length-1)+" rows");
for(var i=1;i<rows.length;i++){
var r=rows[i];if(!r||!r[2])continue;
var nip=norm(r[2]),nama=norm(r[1]);
if(!nama||nip==="NIP/NRP")continue;
if(!all[nip]){var p=splitJ(r[4]);all[nip]={nama:nama,nipnrp:nip,pangkat:norm(r[3]||""),jabatan:p[0],instansi:p[1],jenis:norm(r[5]||"")};}
}
});
var data=Object.values(all);
console.log("Unique NIP: "+data.length);
var cl=await pool.connect();
var n=0;
try{
await cl.query("BEGIN");
for(var j=0;j<data.length;j++){
var row=data[j];
await cl.query("INSERT INTO data_individu (nama,nipnrp,pangkat,jabatan,instansi,jenis_penghargaan,tgl_upload) VALUES ($1,$2,$3,$4,$5,$6,CURRENT_DATE)",[row.nama,row.nipnrp,row.pangkat,row.jabatan,row.instansi,row.jenis]);
n++;
if(n%100===0)console.log(n+"/"+data.length+"...");
}
await cl.query("COMMIT");
var cnt=await cl.query("SELECT COUNT(*) as cnt FROM data_individu");
console.log("DONE! DB has "+cnt.rows[0].cnt+" rows");
}catch(e){await cl.query("ROLLBACK");console.error("FAIL: "+e.message);}
finally{cl.release();await pool.end();}
}
run();
