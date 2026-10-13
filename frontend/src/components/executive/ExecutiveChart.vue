<template><div class="relative h-full min-w-0"><canvas ref="canvas" role="img" :aria-label="description"></canvas></div></template>

<script setup>
import { ref, watch, onMounted, onBeforeUnmount } from 'vue';
import { useReducedMotion } from 'motion-v';
import { Chart, BarController, BarElement, LineController, LineElement, PointElement, DoughnutController, ArcElement, CategoryScale, LinearScale, Tooltip, Legend, Filler } from 'chart.js';
Chart.register(BarController,BarElement,LineController,LineElement,PointElement,DoughnutController,ArcElement,CategoryScale,LinearScale,Tooltip,Legend,Filler);
const props=defineProps({type:{type:String,default:'bar'},labels:{type:Array,default:()=>[]},datasets:{type:Array,default:()=>[]},description:{type:String,required:true},stacked:Boolean,horizontal:Boolean,legend:{type:Boolean,default:true}});
const canvas=ref(null);const reduced=useReducedMotion();let chart;
function data(){return {labels:[...props.labels],datasets:props.datasets.map(d=>({...d,data:[...d.data]}))};}
function options(){return {
  responsive:true,maintainAspectRatio:false,indexAxis:props.horizontal?'y':'x',
  animation:reduced.value?false:{duration:650,easing:'easeOutQuart'},
  cutout:'76%',interaction:{mode:props.type==='doughnut'?'nearest':'index',intersect:false},
  plugins:{legend:{display:props.legend,position:'bottom',labels:{usePointStyle:true,boxWidth:8,padding:20,font:{size:11}}},tooltip:{backgroundColor:'#142a48',padding:12,cornerRadius:10,displayColors:true}},
  ...(props.type==='doughnut'?{}:{scales:{
    x:{stacked:props.stacked,beginAtZero:props.horizontal,grid:{display:props.horizontal,color:'#edf1f6'},ticks:{font:{size:11},precision:0,maxRotation:0}},
    y:{stacked:props.stacked,beginAtZero:true,grid:{display:!props.horizontal,color:'#edf1f6'},ticks:{font:{size:11},precision:0}},
  }}),
};}
function update(){
  if(!canvas.value)return;
  if(chart&&chart.config.type!==props.type){chart.destroy();chart=null;}
  if(!chart)chart=new Chart(canvas.value,{type:props.type,data:data(),options:options()});
  else {chart.data=data();chart.options=options();chart.update(reduced.value?'none':undefined);}
}
function finish(){chart?.stop();chart?.update('none');}
onMounted(()=>{update();window.addEventListener('beforeprint',finish);});
watch(()=>[props.type,props.labels,props.datasets,props.stacked,props.horizontal,props.legend,reduced.value],update,{deep:true});
onBeforeUnmount(()=>{chart?.destroy();window.removeEventListener('beforeprint',finish);});
</script>
