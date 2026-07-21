/* Fixed publisher-size implementation of a bow-front empire-waist maxi dress.
   The only drafting control is the eight paired sizes printed in the supplied
   publisher PDF. Student measurements and design options do not alter plates. */
(function(){
  'use strict';

  const SOURCE='https://blog.moodfabrics.com/the-jarrah-dress-free-sewing-pattern/';
  const IN=25.4;
  const SIZE_ROWS=[
    {id:'0/2',bust:32.5,waist:24.5,hips:34.5},
    {id:'4/6',bust:34.5,waist:25.5,hips:35.5},
    {id:'8/10',bust:36.5,waist:27.5,hips:37.5},
    {id:'12/14',bust:39.5,waist:30.5,hips:40.5},
    {id:'16/18',bust:43.5,waist:34.5,hips:45},
    {id:'20/22',bust:48.5,waist:39.5,hips:51},
    {id:'24/26',bust:53.5,waist:44.5,hips:57},
    {id:'28/30',bust:58.5,waist:49.5,hips:63}
  ];
  const FIXED_SIZES={
    label:'Published size',default:'8/10',unit:'in',seamAllowanceMM:12.7,
    seamAllowanceText:'The publisher\'s 1/2-inch seam allowance is included on sewn edges. Place-on-fold edges have none.',
    fitNote:'Choose only from the eight paired sizes printed in the supplied pattern. Make a bodice test garment before cutting final fabric.',
    measurementLabels:{bust:'Body bust',waist:'Body waist',hips:'Body hips'},
    entries:SIZE_ROWS.map(row=>({id:row.id,chartSize:row.id,measurements:{bust:row.bust,waist:row.waist,hips:row.hips}}))
  };
  const GUIDE=`## Before sewing

- Choose one of the eight original paired publisher sizes. The 1/2-inch seam allowance is included on every sewn edge; place-on-fold edges have no allowance.
- Make a bodice test garment and adjust only after checking the neckline, underbust seam, strap length, and zipper placement.
- Suggested fabric: 3 yards of fashion crepe or a similar woven, 2 yards of lining, and about 3 yards of optional trim. Prepare a 9-inch zipper.
- Transfer the darts, gathering limits, center-front bow placement, strap positions, zipper stop, grainlines, and lettered seam matches before removing the paper.

## 1. Sew the bodice darts

Sew the marked darts in both front and back bodice sections. Press the front darts toward the side seams and the back darts toward center back.

## 2. Join the bodice side seams

With right sides together, match A to A and sew each front bodice to its corresponding back bodice. Repeat for the lining or facing layer and press the seams open.

## 3. Prepare and place the straps

Fold each strap lengthwise, sew the long edge, turn, and press. Baste straps at the B placement marks on the bodice front, checking that each strap lies flat and is not twisted.

## 4. Make the center-front bow

Pair the four bow pieces right sides together to make two ribbons. Sew around each ribbon, leaving its short attachment end open. Turn and press. Insert the open ends at the two C marks, 1/2 inch from center front.

## 5. Finish the bodice upper edge

Place the lining or facing over the outer bodice, right sides together. Sew the upper edge, enclosing the straps and bow ribbons. Clip curves and corners, turn, understitch where possible, and press.

## 6. Assemble the skirts

Join the front skirt to the two back skirt sections at D. Repeat for the lining. Leave center back open above the marked zipper stop. Finish and press the side seams.

## 7. Finish the front skirt opening

Sew the lining to the fashion fabric around the front V opening. Clip precisely to the point without cutting the stitches, turn the lining inside, and press.

## 8. Gather the upper skirt

Sew two rows of gathering stitches between the marked limits, stopping 1 inch from every zipper edge. Pull the threads until the skirt matches the bodice underbust edge.

## 9. Join bodice and skirt

Match E to E, center front, side seams, and center back. Sew the fashion layers together first, keeping the lining free, then press the allowance upward.

## 10. Insert the zipper and close the lining

Install the 9-inch zipper at center back between the outer bodice and its lining or facing. Sew the remaining center-back skirt seam below the zipper, then slipstitch or understitch the lining neatly over the waist seam and zipper tapes.

## 11. Finish

Level and hem the fashion skirt and lining separately. Tie the front bow, tack it invisibly if desired, and add optional trim only after the dress hangs smoothly.`;
  const ABOUT={
    name:'Bow-Front Empire-Waist Maxi Dress',
    description:'A lined woven maxi dress with curved front bodice cups, slim straps, an empire waist, gathered skirt, center-front bow, and back zipper.',
    difficulty:3,
    yardage:'3 yd + 2 yd lining',
    yardageNote:'Official estimate: 3 yards fashion fabric, 2 yards lining, and 3 yards optional trim.',
    tags:['dresses'],
    techniques:['darts','lining','gathers','zipper','bow-ties'],
    illustration:'illustrations/jarrah.svg',sourceUrl:SOURCE,
    sourceLabel:'Based on the linked publisher pattern',generated:true,fixedSizing:true
  };
  const CONFIG={measurements:[],optionalMeasurements:[],options:{}};
  const fmt=value=>Number(Number(value).toFixed(2));
  const esc=value=>String(value==null?'':value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
  const rowFor=settings=>SIZE_ROWS.find(row=>row.id===String(settings&&settings.options&&settings.options.publishedSize))||SIZE_ROWS[2];
  const line=(x1,y1,x2,y2,cls='mark')=>'<line class="'+cls+'" x1="'+fmt(x1)+'" y1="'+fmt(y1)+'" x2="'+fmt(x2)+'" y2="'+fmt(y2)+'"/>';
  function grain(x,y,length){return '<g class="grain">'+line(x,y,x,y+length,'grain-line')+'<path d="M '+fmt(x)+' '+fmt(y)+' l -4 8 h 8 z M '+fmt(x)+' '+fmt(y+length)+' l -4 -8 h 8 z"/><text x="'+fmt(x+7)+'" y="'+fmt(y+length/2)+'">GRAINLINE</text></g>';}
  function fold(x,y,length){
    const arrows=[.34,.68].map(f=>{const ay=y+length*f;return '<path class="fold-arrow" d="M '+fmt(x+27)+' '+fmt(ay)+' H '+fmt(x+4)+' M '+fmt(x+4)+' '+fmt(ay)+' l 7 -4 M '+fmt(x+4)+' '+fmt(ay)+' l 7 4"/>';}).join('');
    return line(x,y,x,y+length,'fold-line')+arrows+'<text class="fold-text" transform="translate('+fmt(x+18)+' '+fmt(y+length/2)+') rotate(-90)">PLACE ON FOLD</text>';
  }
  function notch(x,y,dx,dy,label){const length=Math.hypot(dx,dy)||1,ux=dx/length,uy=dy/length;return line(x+ux*2,y+uy*2,x+ux*11,y+uy*11,'notch')+'<text class="seam-letter" x="'+fmt(x+ux*17)+'" y="'+fmt(y+uy*17+2)+'">'+esc(label)+'</text>';}
  function title(letter,name,cut,x,y,size){return '<g class="piece-label" transform="translate('+fmt(x)+' '+fmt(y)+')"><text class="piece-number" x="0" y="0">'+letter+'</text><text class="piece-name" x="25" y="-15">'+esc(name)+'</text><text class="pattern-name" x="25" y="-7">Bow-Front Empire-Waist Maxi Dress</text><text class="size-label" x="25" y="1">Published size '+esc(size)+'</text>'+String(cut).split('|').map((s,i)=>'<text class="cut-instruction" x="25" y="'+(9+i*7)+'">'+esc(s)+'</text>').join('')+'</g>';}
  const piece=(id,letter,name,w,h,body)=>({id,letter,name,w:fmt(w),h:fmt(h),body});

  function buildPieces(settings){
    const row=rowFor(settings),sa=12.7,edge=9,p=[];
    const bust=row.bust*IN,waist=row.waist*IN;
    const cupW=fmt(bust/4+22),cupH=fmt(255+(row.bust-32.5)*2.1);
    const backW=fmt(bust/4+35),backH=fmt(205+(row.bust-32.5)*1.4);
    const waistQuarter=waist/4;
    const skirtLength=fmt(1075+(row.id==='0/2'?0:(SIZE_ROWS.indexOf(row))*5));
    const frontHem=fmt(Math.min(720,510+(row.hips-34.5)*5.5));
    const backHem=fmt(Math.min(690,480+(row.hips-34.5)*5.2));

    // A - curved front cup. Darts and labels remain comfortably inside.
    {
      const w=cupW+2*edge,h=cupH+2*edge,x=edge,y=edge;
      const cut='M '+x+' '+fmt(y+cupH)+' L '+fmt(x+8)+' '+fmt(y+95)+' C '+fmt(x+22)+' '+fmt(y+75)+' '+fmt(x+34)+' '+fmt(y+42)+' '+fmt(x+40)+' '+fmt(y+15)+' C '+fmt(x+cupW*.57)+' '+fmt(y-2)+' '+fmt(x+cupW-10)+' '+fmt(y+40)+' '+fmt(x+cupW)+' '+fmt(y+90)+' L '+fmt(x+cupW-5)+' '+fmt(y+cupH)+' Z';
      const stitch='M '+fmt(x+sa)+' '+fmt(y+cupH-sa)+' L '+fmt(x+8+sa*.7)+' '+fmt(y+99)+' C '+fmt(x+28)+' '+fmt(y+78)+' '+fmt(x+39)+' '+fmt(y+48)+' '+fmt(x+45)+' '+fmt(y+23)+' C '+fmt(x+cupW*.57)+' '+fmt(y+7)+' '+fmt(x+cupW-18)+' '+fmt(y+44)+' '+fmt(x+cupW-sa)+' '+fmt(y+92)+' L '+fmt(x+cupW-5-sa)+' '+fmt(y+cupH-sa)+' Z';
      const dartX=x+cupW*.49,dartBase=y+cupH-sa;
      p.push(piece(1,'A','Front Bodice',w,h,'<path class="cut" d="'+cut+'"/><path class="stitch" d="'+stitch+'"/><path class="dart" d="M '+fmt(dartX-19)+' '+fmt(dartBase)+' L '+fmt(dartX)+' '+fmt(y+cupH*.53)+' L '+fmt(dartX+19)+' '+fmt(dartBase)+'"/>'+grain(x+cupW*.76,y+95,cupH*.42)+notch(x+8,y+cupH*.62,1,0,'A')+notch(x+cupW*.45,y+cupH,0,-1,'E')+notch(x+cupW*.66,y+30,0,1,'B')+notch(x+cupW,y+cupH*.48,-1,0,'C')+title('A','Front Bodice','Cut 2 mirrored from fabric|Cut 2 mirrored from lining',x+cupW*.10,y+cupH*.72,row.id)));
    }
    // B - back bodice with center-back zipper edge.
    {
      const w=backW+2*edge,h=backH+2*edge,x=edge,y=edge;
      const cut='M '+x+' '+fmt(y+backH)+' L '+x+' '+fmt(y+22)+' L '+fmt(x+backW*.18)+' '+fmt(y+12)+' C '+fmt(x+backW*.42)+' '+fmt(y+48)+' '+fmt(x+backW*.72)+' '+fmt(y+52)+' '+fmt(x+backW)+' '+fmt(y+85)+' L '+fmt(x+backW-4)+' '+fmt(y+backH)+' Z';
      const stitch='M '+fmt(x+sa)+' '+fmt(y+backH-sa)+' L '+fmt(x+sa)+' '+fmt(y+28)+' L '+fmt(x+backW*.18)+' '+fmt(y+22)+' C '+fmt(x+backW*.43)+' '+fmt(y+56)+' '+fmt(x+backW*.72)+' '+fmt(y+60)+' '+fmt(x+backW-sa)+' '+fmt(y+89)+' L '+fmt(x+backW-4-sa)+' '+fmt(y+backH-sa)+' Z';
      const dartX=x+backW*.57,dartBase=y+backH-sa;
      p.push(piece(2,'B','Back Bodice',w,h,'<path class="cut" d="'+cut+'"/><path class="stitch" d="'+stitch+'"/><path class="dart" d="M '+fmt(dartX-15)+' '+fmt(dartBase)+' L '+fmt(dartX)+' '+fmt(y+backH*.56)+' L '+fmt(dartX+15)+' '+fmt(dartBase)+'"/>'+line(x+sa,y+35,x+sa,y+backH-sa,'zip-line')+grain(x+backW*.80,y+95,backH*.38)+notch(x+backW,y+backH*.58,-1,0,'A')+notch(x+backW*.47,y+backH,0,-1,'E')+notch(x+backW*.75,y+62,0,1,'B')+title('B','Back Bodice','Cut 2 mirrored from fabric|Cut 2 mirrored from lining',x+backW*.08,y+backH*.73,row.id)));
    }
    // C - straight shoulder strap.
    {
      const pw=58,ph=385,x=edge,y=edge;
      const verticalTitle='<g class="piece-label" transform="translate('+fmt(x+pw*.50)+' '+fmt(y+35)+') rotate(90)"><text class="piece-name" x="0" y="0">C - Shoulder Strap</text><text class="pattern-name" x="0" y="8">Bow-Front Empire-Waist Maxi Dress</text><text class="size-label" x="0" y="16">Published size '+esc(row.id)+'</text><text class="cut-instruction" x="0" y="24">Cut 4 from fabric</text></g>';
      p.push(piece(3,'C','Shoulder Strap',pw+2*edge,ph+2*edge,'<rect class="cut" x="'+x+'" y="'+y+'" width="'+pw+'" height="'+ph+'"/><rect class="stitch" x="'+fmt(x+sa)+'" y="'+fmt(y+sa)+'" width="'+fmt(pw-2*sa)+'" height="'+fmt(ph-2*sa)+'"/>'+grain(x+pw/2,y+245,ph-285)+notch(x+pw/2,y+ph,0,-1,'B')+verticalTitle));
    }
    // D - skirt front on fold. There is intentionally no stitch line on fold.
    {
      const top=fmt(waistQuarter+72),pw=frontHem,ph=skirtLength,x=edge,y=edge;
      const cut='M '+x+' '+y+' L '+fmt(x+top)+' '+y+' C '+fmt(x+top+85)+' '+fmt(y+ph*.35)+' '+fmt(x+pw-25)+' '+fmt(y+ph*.72)+' '+fmt(x+pw)+' '+fmt(y+ph)+' L '+x+' '+fmt(y+ph)+' Z';
      const stitch='M '+fmt(x+top-sa)+' '+fmt(y+sa)+' C '+fmt(x+top+72)+' '+fmt(y+ph*.35)+' '+fmt(x+pw-38)+' '+fmt(y+ph*.72)+' '+fmt(x+pw-sa)+' '+fmt(y+ph-sa)+' L '+fmt(x+sa)+' '+fmt(y+ph-sa);
      const testX=x+110,testY=y+ph*.58;
      const test='<g class="calibration-group" transform="translate('+fmt(testX)+' '+fmt(testY)+')"><rect class="calibration-clear" x="-8" y="-8" width="42" height="51"/><rect class="calibration" width="25.4" height="25.4"/><text class="calibration-text" x="12.7" y="33">1 IN TEST</text><text class="calibration-text" x="12.7" y="39">25.4 MM</text></g>';
      const gather=line(x+45,y+8,x+top-18,y+8,'gather-line')+'<text class="gather-text" x="'+fmt(x+top*.56)+'" y="'+fmt(y+20)+'">GATHER BETWEEN MARKS</text>';
      p.push(piece(4,'D','Front Skirt',pw+2*edge,ph+2*edge,'<path class="cut" d="'+cut+'"/><path class="stitch" d="'+stitch+'"/>'+fold(x,y,ph)+gather+grain(x+pw*.58,y+ph*.24,ph*.42)+notch(x+top,y,0,1,'E')+notch(x+pw,y+ph*.34,-1,0,'D')+title('D','Front Skirt','Cut 1 on fold from fabric|Cut 1 on fold from lining',x+pw*.27,y+ph*.43,row.id)+test));
    }
    // E - back skirt with straight zipper edge and curved side seam.
    {
      const top=fmt(waistQuarter+62),pw=backHem,ph=skirtLength,x=edge,y=edge;
      const cut='M '+x+' '+y+' L '+fmt(x+top)+' '+y+' C '+fmt(x+top+75)+' '+fmt(y+ph*.34)+' '+fmt(x+pw-22)+' '+fmt(y+ph*.72)+' '+fmt(x+pw)+' '+fmt(y+ph)+' L '+x+' '+fmt(y+ph)+' Z';
      const stitch='M '+fmt(x+sa)+' '+fmt(y+sa)+' L '+fmt(x+top-sa)+' '+fmt(y+sa)+' C '+fmt(x+top+62)+' '+fmt(y+ph*.34)+' '+fmt(x+pw-35)+' '+fmt(y+ph*.72)+' '+fmt(x+pw-sa)+' '+fmt(y+ph-sa)+' L '+fmt(x+sa)+' '+fmt(y+ph-sa)+' Z';
      p.push(piece(5,'E','Back Skirt',pw+2*edge,ph+2*edge,'<path class="cut" d="'+cut+'"/><path class="stitch" d="'+stitch+'"/>'+line(x+sa,y+18,x+sa,y+245,'zip-line')+'<text class="zip-text" transform="translate('+fmt(x+22)+' '+fmt(y+145)+') rotate(-90)">CENTER BACK - ZIPPER</text>'+line(x+40,y+8,x+top-18,y+8,'gather-line')+'<text class="gather-text" x="'+fmt(x+top*.55)+'" y="'+fmt(y+20)+'">GATHER BETWEEN MARKS</text>'+grain(x+pw*.58,y+ph*.24,ph*.42)+notch(x+top,y,0,1,'E')+notch(x+pw,y+ph*.34,-1,0,'D')+title('E','Back Skirt','Cut 2 mirrored from fabric|Cut 2 mirrored from lining',x+pw*.25,y+ph*.48,row.id)));
    }
    // F - tapered bow ribbon, cut four.
    {
      const pw=145,ph=540,x=edge,y=edge;
      const cut='M '+x+' '+y+' L '+fmt(x+pw)+' '+fmt(y+18)+' L '+fmt(x+112)+' '+fmt(y+ph)+' L '+fmt(x+30)+' '+fmt(y+ph)+' Z';
      const stitch='M '+fmt(x+sa)+' '+fmt(y+sa)+' L '+fmt(x+pw-sa)+' '+fmt(y+27)+' L '+fmt(x+112-sa)+' '+fmt(y+ph-sa)+' L '+fmt(x+30+sa)+' '+fmt(y+ph-sa)+' Z';
      p.push(piece(6,'F','Bow Ribbon',pw+2*edge,ph+2*edge,'<path class="cut" d="'+cut+'"/><path class="stitch" d="'+stitch+'"/>'+grain(x+pw*.52,y+90,ph*.55)+notch(x+pw*.5,y+ph,0,-1,'C')+title('F','Bow Ribbon','Cut 4 from fabric',x+18,y+ph*.54,row.id)));
    }
    return p;
  }

  function render(settings){
    settings=settings||{};
    const pieces=buildPieces(settings),maxWidth=Math.max(400,Math.min(Number(settings.maxWidth)||900,904.4)),margin=10,gap=10;
    if(pieces.some(item=>item.w>maxWidth-2*margin)) throw new Error('A publisher plate is wider than the selected roll.');
    // A compact shelf packer. Tall skirt pieces are placed first and the
    // bodice, strap, and bow plates fill the remaining shelf space.
    const ordered=[...pieces].sort((a,b)=>b.h-a.h||b.w-a.w);
    let x=margin,y=margin,rowH=0;
    for(const item of ordered){
      if(x>margin&&x+item.w>maxWidth-margin){x=margin;y+=rowH+gap;rowH=0;}
      item.x=x;item.y=y;x+=item.w+gap;rowH=Math.max(rowH,item.h);
    }
    const width=Math.min(maxWidth,Math.max(400,...ordered.map(item=>item.x+item.w+margin)));
    const height=Math.max(...ordered.map(item=>item.y+item.h+margin));
    const css=`text{font-family:-apple-system,system-ui,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;fill:#111;font-size:5px;font-weight:300}.cut{fill:#fff;stroke:#212121;stroke-width:.6;vector-effect:non-scaling-stroke}.stitch,.dart{fill:none;stroke:#212121;stroke-width:.4;stroke-dasharray:.5 1;vector-effect:non-scaling-stroke}.mark,.notch,.gather-line{fill:none;stroke:#3b82f6;stroke-width:.4;vector-effect:non-scaling-stroke}.gather-line{stroke-dasharray:1 1.5}.fold-line,.fold-arrow,.grain-line,.zip-line{fill:none;stroke:#8b5cf6;stroke-width:.4;vector-effect:non-scaling-stroke}.fold-line{stroke-dasharray:15 1.5 1 1.5}.zip-line{stroke-dasharray:1 1.5}.grain path{fill:#8b5cf6}.grain text,.fold-text,.pattern-name,.zip-text{fill:#8b5cf6;font-size:5px}.piece-number{fill:#8b5cf6;font-size:36px}.piece-name{font-size:7px}.size-label,.cut-instruction{font-size:5px}.seam-letter,.gather-text{fill:#3b82f6;font-size:5px;font-weight:600;text-anchor:middle}.calibration-clear{fill:#fff;stroke:none}.calibration{fill:#fff;stroke:#212121;stroke-width:.6}.calibration-text{font-size:3px;text-anchor:middle}`;
    const groups=ordered.map(item=>'<g id="jarrah-stack-'+item.id+'" data-piece="'+item.letter+'" data-width="'+item.w+'" data-height="'+item.h+'" data-layout-x="'+fmt(item.x)+'" data-layout-y="'+fmt(item.y)+'" transform="translate('+fmt(item.x)+' '+fmt(item.y)+')">'+item.body+'</g>').join('');
    return '<svg xmlns="http://www.w3.org/2000/svg" width="'+fmt(width)+'mm" height="'+fmt(height)+'mm" viewBox="0 0 '+fmt(width)+' '+fmt(height)+'"><style>'+css+'</style><rect width="100%" height="100%" fill="white"/>'+groups+'</svg>';
  }
  window.PatternGenerators=window.PatternGenerators||{};
  window.PatternGenerators.jarrah={about:ABOUT,config:CONFIG,instructions:GUIDE,i18n:{},fixedSizes:FIXED_SIZES,render};
})();
