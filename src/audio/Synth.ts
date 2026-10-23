/** Original Web Audio effects; no audio downloads required. */
export class Synth {
  private context:AudioContext|null=null; volume=.5;
  unlock(){this.context??=new AudioContext();if(this.context.state==='suspended')void this.context.resume();}
  play(type:string,strength=1){
    if(!this.context||this.volume<=0)return;const c=this.context,now=c.currentTime;
    const osc=c.createOscillator(),gain=c.createGain();osc.connect(gain);gain.connect(c.destination);
    const config:Record<string,[OscillatorType,number,number,number]>={hit:['sawtooth',150,34,.13],block:['triangle',570,190,.09],clash:['square',1180,220,.18],dash:['sawtooth',180,70,.07],jump:['triangle',160,310,.08],ego:['sawtooth',54,440,.7],ko:['triangle',260,40,.8],round:['triangle',440,880,.15],skill:['triangle',330,660,.09],ui:['sine',520,720,.07],guardbreak:['square',380,40,.25]};
    const [wave,from,to,duration]=config[type]??config.hit;osc.type=wave;osc.frequency.setValueAtTime(from,now);osc.frequency.exponentialRampToValueAtTime(to,now+duration);
    gain.gain.setValueAtTime(.0001,now);gain.gain.exponentialRampToValueAtTime(.14*this.volume*strength,now+.006);gain.gain.exponentialRampToValueAtTime(.0001,now+duration);osc.start(now);osc.stop(now+duration);
    if(type==='hit'||type==='clash'||type==='ego'){
      const buffer=c.createBuffer(1,c.sampleRate*.1,c.sampleRate);const data=buffer.getChannelData(0);for(let i=0;i<data.length;i++)data[i]=(Math.random()*2-1)*(1-i/data.length);
      const noise=c.createBufferSource(),ng=c.createGain();noise.buffer=buffer;noise.connect(ng);ng.connect(c.destination);ng.gain.setValueAtTime(.15*this.volume,now);ng.gain.exponentialRampToValueAtTime(.0001,now+.1);noise.start(now);
    }
  }
}
