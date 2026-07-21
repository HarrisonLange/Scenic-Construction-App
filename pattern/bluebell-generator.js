/* Fixed publisher-sized implementation of Mood's Bluebell dress.
   The only variable is one of the eight paired cut lines in the source PDF.
   Pattern Lab measurements, samples, and design controls do not re-grade it. */
(function(){
  'use strict';

  const SOURCE='https://blog.moodfabrics.com/the-bluebell-dress-free-sewing-pattern/';
  const SIZE_ROWS=[
    {id:'0/2',chartSize:'2',neck:12.5,bust:32.5,waist:24.5,hips:34.5},
    {id:'4/6',chartSize:'6',neck:13,bust:34.5,waist:25.5,hips:35.5},
    {id:'8/10',chartSize:'10',neck:14,bust:36.5,waist:27.5,hips:37.5},
    {id:'12/14',chartSize:'14',neck:15,bust:39.5,waist:30.5,hips:40.5},
    {id:'16/18',chartSize:'18',neck:16.5,bust:43.5,waist:34.5,hips:45},
    {id:'20/22',chartSize:'22',neck:17.5,bust:48.5,waist:39.5,hips:51},
    {id:'24/26',chartSize:'26',neck:18.5,bust:53.5,waist:44.5,hips:57},
    {id:'28/30',chartSize:'30',neck:19.5,bust:58.5,waist:49.5,hips:63}
  ];
  // Simplified directly from each paired cut line in the publisher PDF.
  // Coordinates are millimetres and stay within 0.4 mm of the source vectors.
  // Plate tuple: [source width, source height, flattened polygon coordinates].
  const SOURCE_PLATES={"0/2":{"E":[680.4,692.3,[680.4,133.5,680.4,692.3,627.3,689.0,597.8,686.3,561.0,681.5,540.1,677.7,516.4,672.5,480.7,662.5,452.6,653.1,420.2,640.5,391.4,627.7,359.0,611.3,332.3,596.2,299.9,575.7,274.8,557.9,252.3,540.5,224.7,516.8,199.7,493.1,173.8,465.6,149.6,437.1,129.4,410.5,109.6,381.5,93.5,355.2,78.4,327.8,59.1,288.0,48.3,262.4,37.5,233.5,28.0,204.1,20.5,176.3,13.7,144.7,10.2,123.5,6.0,87.9,3.4,56.9,0.0,0.0,559.2,0.0,560.3,29.3,561.8,39.2,564.7,50.2,568.9,61.4,574.0,71.8,579.9,81.4,586.9,90.6,595.1,99.5,603.6,107.0,607.9,110.2,623.4,119.3,636.9,125.2,646.1,128.3,659.9,131.4,672.0,132.8]],"D":[76.2,316.7,[76.2,0.0,76.2,316.7,0.0,316.7,0.0,0.0,38.1,0.0]],"C":[329.2,535.6,[180.5,82.4,187.1,88.4,194.5,94.0,206.3,101.2,223.2,108.6,237.6,112.5,245.8,116.6,256.4,123.1,266.4,130.5,277.5,140.4,284.4,147.8,293.5,159.6,304.5,178.7,313.6,199.1,318.6,212.9,324.3,234.2,327.0,249.0,329.2,271.1,327.3,291.9,323.5,308.4,317.9,324.1,314.4,331.7,303.7,349.7,290.5,366.0,284.5,372.0,276.0,379.2,268.1,385.3,212.6,414.0,201.9,421.1,193.2,428.2,184.1,438.2,177.6,448.5,172.0,460.8,46.7,535.6,33.6,501.7,21.1,462.9,11.2,423.4,3.1,380.5,1.1,330.1,0.0,267.7,0.9,208.5,2.6,160.7,5.7,138.4,9.5,117.9,14.7,94.6,21.3,69.9,32.5,35.9,46.7,0.0,172.8,73.8,178.0,79.7]],"A":[276.5,361.6,[262.8,159.2,276.5,234.8,187.0,361.6,21.0,361.6,21.0,200.8,31.0,195.4,39.7,189.2,44.9,184.3,54.9,172.5,59.0,166.0,62.1,159.0,64.1,151.8,65.0,144.7,55.2,119.6,38.9,86.9,19.6,55.9,0.0,29.2,41.9,0.0,123.8,117.2]],"B":[223.3,371.4,[223.3,28.4,223.3,371.4,0.0,371.4,0.0,208.0,16.2,201.5,23.4,196.8,29.9,190.8,39.6,178.6,43.4,172.4,47.0,163.5,48.8,154.4,48.9,124.6,47.3,99.0,45.5,82.0,40.1,48.0,31.6,10.8,73.8,0.0,88.5,9.6,98.6,15.1,109.2,19.7,120.2,23.3,131.4,26.1,142.9,27.8,154.3,28.6,166.2,28.4]]},"4/6":{"E":[692.9,704.9,[692.9,146.1,692.9,704.9,661.4,703.1,615.3,699.5,571.3,693.9,549.8,690.0,522.1,683.8,489.5,674.6,461.8,665.3,428.0,652.2,396.2,638.0,364.1,621.7,336.7,606.2,305.5,586.3,273.6,563.5,248.9,543.7,222.6,520.5,198.5,497.1,177.0,474.2,152.4,445.1,126.9,411.2,111.6,388.5,91.8,355.8,76.0,326.4,60.2,293.3,45.1,257.0,37.6,236.5,26.1,199.7,18.6,170.1,13.3,143.8,9.4,118.5,6.0,89.5,3.4,58.0,0.0,0.0,558.9,0.0,561.2,34.4,563.4,45.8,566.6,56.4,571.6,68.8,577.6,80.3,584.6,91.0,592.7,101.1,602.1,110.8,609.4,117.2,625.7,127.9,636.7,133.7,647.3,138.0,660.0,142.0,671.4,144.2,684.1,145.5]],"D":[76.2,329.3,[76.2,0.0,76.2,329.3,0.0,329.3,0.0,0.0,38.1,0.0]],"C":[335.6,561.2,[180.9,83.7,191.7,93.9,207.8,105.4,216.4,110.1,225.7,114.2,241.0,119.1,254.2,126.3,267.3,135.1,283.1,148.9,293.6,160.8,299.9,169.3,311.0,189.1,320.2,209.9,327.3,231.5,330.8,246.0,333.5,261.2,335.6,283.9,333.9,305.1,330.5,320.9,323.0,341.9,319.3,349.7,312.9,360.8,300.2,377.8,294.3,384.3,282.7,394.8,274.6,401.1,215.9,433.0,202.7,442.0,192.1,452.0,183.7,462.7,176.2,476.1,172.2,486.2,46.5,561.2,31.0,519.5,19.5,481.1,14.8,461.9,8.8,432.7,3.1,393.1,0.5,322.6,0.0,280.5,0.9,221.4,2.6,173.6,6.5,143.0,10.1,122.1,16.5,92.1,21.7,72.2,30.8,42.3,46.4,0.0,173.1,74.1,178.3,80.7]],"A":[282.3,377.3,[268.7,168.6,282.3,244.1,189.8,377.3,14.4,377.3,14.4,209.2,30.1,202.6,37.2,198.4,43.7,193.5,51.5,185.6,57.9,176.3,61.7,167.7,64.0,158.8,64.8,150.2,52.1,117.2,37.8,87.9,19.7,57.4,0.0,29.2,41.9,0.0,123.7,123.6]],"B":[235.7,387.0,[235.7,31.6,235.7,387.0,0.0,387.0,0.0,216.4,14.3,212.3,20.9,209.7,29.3,204.8,36.3,199.0,45.0,189.0,49.0,182.6,52.9,173.4,55.1,163.3,55.6,145.4,55.1,125.6,52.1,86.2,48.2,58.8,37.9,10.9,80.3,0.0,95.3,10.4,105.7,16.3,116.6,21.3,128.0,25.3,139.5,28.4,151.4,30.5,163.3,31.5,175.7,31.6]]},"8/10":{"E":[705.5,717.4,[705.5,158.6,705.5,717.4,650.5,714.0,619.8,711.2,595.8,708.3,561.4,702.6,523.2,693.8,498.4,686.6,469.3,676.8,435.8,663.8,401.0,648.2,367.2,630.8,342.9,616.9,314.0,598.6,287.4,580.0,261.7,560.2,227.9,531.0,204.3,508.0,180.3,482.6,155.2,453.0,134.3,425.5,119.5,404.3,97.0,368.1,81.3,339.7,65.1,306.6,50.1,272.0,38.4,240.6,28.4,209.5,19.3,174.4,14.3,150.0,10.6,128.0,6.2,91.1,2.3,39.7,0.0,0.0,558.7,0.0,561.9,36.6,563.5,45.5,566.2,55.5,571.4,69.5,577.8,82.7,585.3,94.9,593.9,106.2,603.9,117.0,617.7,129.1,626.1,134.9,642.9,144.5,657.8,150.7,667.8,153.8,683.0,156.9,696.3,158.1]],"D":[76.2,342.1,[76.2,0.0,76.2,342.1,0.0,342.1,0.0,0.0,38.1,0.0]],"C":[341.9,586.9,[181.2,85.1,196.3,99.9,209.2,109.5,218.2,114.9,228.0,119.8,244.2,125.8,253.8,130.6,261.5,135.1,272.4,142.5,282.5,151.0,291.8,160.4,300.3,170.5,306.3,179.0,317.5,199.4,326.7,220.8,331.7,235.5,337.3,257.9,340.8,280.9,341.9,296.7,340.4,318.4,336.9,335.7,329.8,356.1,321.9,371.7,312.3,386.2,301.0,399.7,289.3,410.5,281.1,417.0,228.1,447.6,216.1,453.9,205.8,461.2,195.5,471.0,186.0,483.0,178.5,496.3,172.3,511.7,46.2,586.9,29.5,538.7,23.0,516.1,16.6,490.6,8.5,448.6,3.1,405.9,1.1,355.6,0.0,293.4,0.9,234.4,2.6,186.6,6.2,153.9,9.6,131.5,13.6,110.2,21.1,77.8,33.6,35.4,46.2,0.0,173.3,74.4,178.6,81.7]],"A":[288.2,393.0,[274.5,178.0,288.2,253.4,192.7,393.0,7.8,393.0,7.8,217.7,21.8,213.4,30.5,209.9,42.4,202.7,49.4,196.9,55.6,188.7,60.6,178.7,63.7,167.8,64.6,156.6,53.3,125.3,36.9,89.6,20.6,60.8,0.0,29.3,41.9,0.0,123.7,130.0]],"B":[248.2,402.5,[248.2,34.6,248.2,402.5,0.0,402.5,0.0,224.9,13.1,222.3,24.0,218.9,32.6,214.7,41.8,208.3,48.2,202.0,54.4,193.1,59.6,180.8,61.7,170.0,62.0,144.6,61.5,125.5,58.6,88.5,53.2,51.4,44.4,10.9,86.8,0.0,102.2,11.0,112.9,17.4,124.2,22.8,135.8,27.2,147.8,30.6,160.1,33.0,172.4,34.4,185.3,34.6]]},"12/14":{"E":[724.1,736.1,[724.1,177.3,724.1,736.1,646.2,730.8,597.1,724.6,566.4,718.9,537.1,711.9,498.8,700.4,469.5,689.9,440.6,678.2,406.6,662.7,376.9,647.3,344.4,628.5,313.1,608.0,277.3,581.8,251.8,560.7,225.4,536.9,203.2,514.8,176.4,485.3,153.8,457.9,132.7,429.5,110.9,396.6,88.7,358.5,74.3,330.6,63.0,306.4,47.2,268.4,36.5,238.3,27.4,208.8,19.8,179.0,14.6,154.0,9.6,122.4,6.3,93.5,3.6,60.5,0.0,0.0,558.4,0.0,563.3,42.1,569.0,63.9,575.6,79.8,583.4,94.8,592.5,108.6,602.9,121.4,617.9,136.4,631.2,147.0,650.5,159.1,659.5,163.7,670.6,168.5,687.5,173.8,700.0,176.0,715.1,177.1]],"D":[76.2,354.7,[76.2,0.0,76.2,354.7,0.0,354.7,0.0,0.0,38.1,0.0]],"C":[348.2,611.9,[181.5,83.4,188.8,92.2,197.0,100.6,205.8,108.4,215.2,115.4,230.3,124.4,257.4,137.0,271.3,145.7,280.0,152.2,288.2,159.3,299.6,171.0,312.7,188.5,324.0,209.4,330.5,224.1,338.3,246.5,343.9,269.5,346.4,285.4,348.2,309.2,347.0,331.3,343.6,348.7,338.2,365.9,330.8,382.0,321.7,397.2,310.7,411.3,301.4,420.9,287.7,432.5,231.3,466.4,219.4,472.7,209.1,479.9,200.3,488.5,187.9,504.8,180.1,519.1,172.5,539.9,45.9,611.9,30.4,565.1,18.6,520.5,13.3,494.9,9.1,470.7,5.9,446.4,3.1,418.3,1.1,368.1,0.0,305.9,0.9,246.9,2.6,199.2,4.6,175.6,10.0,135.4,14.5,110.2,21.2,80.2,29.7,48.8,45.9,0.0,173.6,71.2,178.9,79.6]],"A":[298.9,408.0,[285.3,186.7,298.9,262.0,200.4,408.0,0.0,408.0,0.0,225.5,17.0,221.8,27.5,218.6,42.4,211.3,51.3,205.2,57.0,197.3,61.4,188.8,64.7,178.2,66.3,166.9,66.2,162.1,58.9,139.7,49.4,115.4,42.4,99.6,26.6,68.9,1.3,28.0,47.2,0.0,128.5,135.7]],"B":[266.7,417.9,[266.7,37.6,266.7,417.9,0.0,417.9,0.0,233.0,15.3,231.1,31.8,227.4,40.7,223.8,49.8,218.2,57.7,210.8,65.2,199.5,69.1,189.5,71.2,178.9,71.3,130.9,69.0,94.8,64.1,58.9,59.1,33.7,53.7,10.5,99.5,0.0,115.3,11.7,126.3,18.4,137.8,24.2,149.8,29.0,162.1,32.8,174.8,35.4,187.5,37.1,200.8,37.6]]},"16/18":{"E":[749.1,761.1,[749.1,202.3,749.1,761.1,668.5,755.6,617.7,749.3,594.7,745.2,555.6,736.1,516.1,724.3,480.6,711.5,452.2,699.8,420.8,685.3,390.0,669.4,364.2,654.7,341.1,640.3,324.0,628.8,296.0,608.6,260.5,579.9,233.3,555.2,210.3,532.4,182.5,501.9,159.2,473.6,137.4,444.1,117.1,413.7,98.8,383.2,81.2,350.3,65.2,316.8,48.9,277.6,40.8,255.4,30.2,222.4,20.5,185.1,15.2,159.3,10.0,126.6,6.6,96.7,2.4,42.2,0.0,0.0,558.0,0.0,565.6,49.7,569.0,62.9,573.9,76.5,581.7,93.7,591.6,111.2,603.0,127.1,612.5,138.4,622.8,148.9,642.3,165.3,655.2,173.9,677.0,186.4,689.0,192.0,707.4,198.1,720.6,200.7,739.7,202.1]],"D":[76.2,367.5,[76.2,0.0,76.2,367.5,0.0,367.5,0.0,0.0,38.1,0.0]],"C":[354.6,642.9,[181.7,79.3,188.9,90.0,197.3,100.5,211.3,114.7,221.4,123.2,232.4,131.0,265.9,149.3,284.8,162.6,301.5,178.2,309.1,187.0,319.1,200.9,330.5,222.4,337.0,237.5,342.5,252.7,348.8,276.1,352.9,300.3,354.6,324.7,354.0,342.8,351.3,360.8,349.1,369.7,344.9,382.5,341.5,390.9,335.5,403.1,330.9,410.9,323.2,422.0,311.2,435.9,294.1,451.1,234.4,488.2,224.7,493.2,215.7,498.9,212.4,501.5,199.7,516.1,191.7,527.7,183.0,544.3,178.1,557.5,172.9,577.6,45.5,642.9,33.4,605.1,26.7,581.1,18.8,548.3,13.9,523.5,8.6,490.2,5.7,465.1,3.1,433.7,1.8,405.4,0.4,352.9,0.1,308.1,1.5,243.3,3.5,200.1,5.5,177.3,10.4,139.3,15.4,110.6,22.0,79.6,32.4,40.9,45.5,0.0,174.0,64.7,179.1,74.7]],"A":[323.8,423.0,[310.2,195.4,323.8,270.6,222.3,423.0,0.0,423.0,0.0,233.1,21.9,230.4,35.7,227.5,49.0,223.0,67.3,213.4,72.8,205.4,77.6,195.5,80.9,184.1,82.1,173.1,82.0,167.7,76.0,148.1,68.4,126.6,59.7,105.6,42.4,69.9,16.8,26.8,66.5,0.0,147.4,141.4]],"B":[291.6,433.3,[291.6,40.5,291.6,433.3,0.0,433.3,0.0,241.0,17.5,240.4,38.9,237.6,50.7,234.0,60.2,229.4,66.7,225.2,73.7,219.4,78.4,212.7,83.7,201.5,86.6,190.0,87.3,182.1,87.3,139.5,86.5,118.9,84.9,97.8,82.5,76.8,79.3,56.5,69.4,10.1,118.6,0.0,140.1,15.9,151.8,22.7,163.9,28.4,182.8,34.9,195.9,37.9,209.0,39.8,222.8,40.5]]},"20/22":{"E":[780.5,792.4,[780.5,233.6,780.5,792.4,719.7,788.7,685.8,785.6,643.7,780.1,619.7,775.8,592.6,769.9,551.6,758.5,510.2,744.4,482.3,733.3,449.3,718.7,406.5,697.0,379.6,681.7,347.6,661.5,318.2,640.9,289.8,619.0,257.3,591.2,226.8,562.0,199.7,533.3,176.5,506.2,148.8,470.2,129.9,442.9,107.6,406.8,88.5,372.2,71.3,337.1,55.7,300.6,42.6,266.0,32.6,234.9,23.2,200.1,15.9,165.8,10.5,131.8,6.9,100.7,4.0,65.2,0.0,0.0,557.8,0.0,566.5,48.8,571.4,68.3,576.9,84.1,584.1,100.3,597.5,124.1,609.4,141.3,624.4,159.1,641.3,175.7,660.6,191.1,675.2,201.0,700.5,215.3,717.9,223.4,737.1,229.6,756.7,232.9,770.7,233.5]],"D":[76.2,380.1,[76.2,0.0,76.2,380.1,0.0,380.1,0.0,0.0,38.1,0.0]],"C":[360.9,679.8,[181.6,72.5,188.7,85.9,197.2,99.2,211.7,117.6,222.4,128.8,234.3,139.2,245.7,147.7,254.9,153.9,264.6,158.8,274.5,164.8,291.2,177.2,298.6,183.7,311.1,196.8,318.6,206.2,325.5,216.2,333.5,231.0,343.6,253.8,351.4,277.3,356.9,301.4,359.4,318.1,360.9,343.1,360.1,366.1,356.9,384.5,353.2,397.8,350.1,406.4,344.4,419.1,340.0,427.2,335.2,435.1,327.1,446.3,314.7,460.2,300.6,472.6,237.6,512.9,228.6,517.4,218.2,524.1,215.8,526.0,208.7,535.0,195.8,554.3,189.8,565.8,185.1,576.7,181.2,587.5,178.0,599.1,173.3,624.7,45.0,679.8,33.1,640.2,26.1,613.8,20.1,587.3,12.7,547.2,8.9,520.1,5.9,492.9,4.0,468.0,1.8,423.7,0.3,367.8,0.1,326.5,1.1,273.4,3.3,217.3,5.0,192.6,9.6,151.4,13.7,124.4,21.6,84.4,31.6,44.5,45.0,0.0,174.4,54.5,179.1,66.8]],"A":[355.0,438.2,[341.4,204.3,355.0,279.4,250.5,438.2,0.0,438.2,0.0,241.0,28.8,239.6,47.0,237.2,64.8,232.6,73.4,229.5,89.6,221.9,94.7,214.3,99.0,205.8,102.0,196.8,103.9,186.3,104.1,173.5,94.8,141.6,84.6,113.8,75.3,92.1,63.6,68.2,55.1,52.9,38.8,25.9,92.1,0.0,172.7,147.3]],"B":[322.9,448.8,[322.9,43.6,322.9,448.8,0.0,448.8,0.0,249.2,20.1,250.0,46.5,248.7,54.5,247.5,64.3,245.1,75.5,240.8,86.2,235.2,96.1,228.2,103.4,216.2,105.8,210.6,108.1,202.1,109.6,189.5,109.1,179.8,109.7,150.0,108.8,120.5,107.7,105.9,105.3,82.1,101.8,58.5,91.6,9.9,144.0,0.0,166.0,16.9,178.0,24.0,190.4,30.1,203.3,35.1,216.5,38.9,236.9,42.6,251.1,43.6]]},"24/26":{"E":[811.8,823.8,[811.8,265.0,811.8,823.8,748.5,819.9,713.1,816.8,669.5,811.1,644.6,806.6,625.8,802.7,602.3,796.9,573.8,788.7,540.3,777.4,501.7,762.5,468.8,748.0,433.8,730.6,394.9,708.8,361.6,687.8,331.0,666.4,301.5,643.7,267.7,614.7,238.7,587.2,207.8,554.6,185.2,528.3,160.8,497.0,137.9,464.6,111.9,423.1,93.9,390.5,75.1,352.4,57.9,312.6,44.4,276.6,32.5,239.6,24.3,208.8,16.5,172.5,10.9,137.1,6.1,93.1,0.0,0.0,557.5,0.0,566.0,43.1,572.1,68.7,577.4,85.4,584.8,103.7,596.5,126.2,609.6,147.2,622.2,164.0,635.1,179.0,649.5,193.4,659.9,202.6,676.7,215.9,697.5,229.6,720.2,241.6,728.6,246.7,744.9,254.2,763.1,260.3,782.0,263.9,801.7,265.0]],"D":[76.2,392.9,[76.2,0.0,76.2,392.9,0.0,392.9,0.0,0.0,38.1,0.0]],"C":[367.3,716.7,[181.4,65.7,184.3,73.1,192.6,90.2,201.5,105.5,211.9,120.5,223.3,134.3,236.0,147.5,258.4,166.3,268.2,171.3,279.0,177.9,289.3,185.2,299.1,193.2,312.6,206.4,320.9,216.2,331.9,231.6,336.7,240.3,347.0,262.2,353.0,278.0,358.0,294.2,363.5,318.9,366.6,344.2,367.3,361.6,366.7,385.0,364.6,399.2,359.9,417.4,355.1,430.6,351.2,439.2,339.4,459.4,330.8,470.9,324.5,478.0,307.1,494.1,240.7,537.8,232.1,542.0,223.4,547.5,219.1,550.6,214.7,556.8,206.3,569.0,199.3,580.9,192.9,593.6,185.0,613.5,181.0,626.8,177.8,641.0,173.6,672.1,44.5,716.7,32.7,675.4,25.6,646.7,18.8,614.0,13.3,582.2,8.3,544.5,5.5,514.9,1.8,442.1,0.5,400.2,0.1,345.0,1.1,292.0,3.7,222.2,6.1,188.7,9.7,156.6,14.5,124.7,20.7,91.3,30.9,48.1,44.5,0.0,174.8,44.2,179.1,58.9]],"A":[386.3,453.4,[372.7,213.2,386.3,288.2,278.8,453.4,0.0,453.4,0.0,249.1,20.8,249.6,59.4,247.4,77.6,243.9,95.3,238.2,111.8,230.6,116.6,223.2,120.7,215.0,123.4,207.3,125.7,197.0,126.5,188.1,126.2,179.3,116.9,145.4,107.1,117.2,97.3,93.5,86.2,70.2,77.2,53.3,60.8,25.1,117.6,0.0,198.0,153.1]],"B":[354.1,464.2,[354.1,46.5,354.1,464.2,0.0,464.2,0.0,257.5,22.2,259.6,53.3,259.7,67.7,258.2,87.2,253.3,101.0,247.5,118.3,237.1,125.5,224.7,129.9,212.3,131.7,199.4,131.1,185.9,131.9,154.9,131.5,134.3,129.6,104.1,126.1,74.0,122.9,53.7,113.6,9.6,169.3,0.0,186.2,13.7,197.9,21.7,210.4,28.6,223.4,34.5,236.8,39.3,250.7,42.9,264.7,45.3,279.4,46.5]]},"28/30":{"E":[843.2,855.1,[843.2,296.3,843.2,855.1,777.5,851.1,741.0,847.8,712.3,844.4,669.6,837.3,625.6,827.2,596.0,818.7,561.2,807.0,521.2,791.5,497.3,781.2,450.7,758.4,410.3,735.8,375.0,713.5,343.9,691.8,313.3,668.2,293.6,651.8,270.3,631.0,248.1,609.6,216.0,575.7,192.5,548.5,167.1,515.9,143.3,482.3,122.9,450.2,97.6,405.3,78.1,365.9,60.3,324.5,46.2,287.2,34.5,250.5,24.8,214.6,16.5,174.6,11.7,144.0,7.6,108.7,4.3,70.4,0.0,0.0,557.4,0.0,568.0,49.1,575.4,78.2,581.8,97.1,587.6,111.0,598.1,132.3,612.9,156.8,628.4,178.4,646.2,199.3,666.5,219.1,691.3,239.4,706.5,250.0,720.9,258.9,732.8,265.4,748.4,272.8,756.8,278.0,775.6,286.3,784.3,289.4,796.4,292.7,811.2,295.3,832.7,296.4]],"D":[76.2,405.5,[76.2,0.0,76.2,405.5,0.0,405.5,0.0,0.0,38.1,0.0]],"C":[373.8,753.5,[181.1,58.6,187.9,77.4,196.5,96.4,201.3,105.3,206.5,114.3,217.9,131.5,230.6,147.7,244.6,162.7,261.8,178.5,271.7,183.6,283.1,190.6,293.8,198.2,308.9,211.1,318.1,220.5,326.8,230.7,338.2,246.9,343.1,255.8,353.5,278.3,359.5,294.4,366.6,319.4,370.0,336.3,373.0,362.2,373.8,391.1,372.7,408.6,370.3,423.0,365.2,441.5,355.8,463.5,351.2,471.9,343.4,483.9,334.4,495.4,327.8,502.4,313.5,515.6,243.8,562.5,232.3,568.3,222.3,575.3,211.9,591.0,204.2,604.0,193.3,626.7,187.4,642.4,182.6,658.2,178.9,674.6,176.4,690.7,173.8,719.6,44.1,753.5,32.4,710.6,25.1,679.4,18.9,648.0,13.6,616.5,9.5,584.8,6.3,553.0,4.2,521.1,1.8,460.4,0.5,418.6,0.1,363.4,1.2,305.5,4.1,223.3,6.5,191.0,9.9,160.3,14.4,128.6,19.8,98.0,30.1,51.7,44.1,0.0,175.1,33.7,180.0,54.9]],"A":[417.5,468.6,[403.9,222.1,417.5,297.0,307.0,468.6,0.0,468.6,0.0,257.5,22.8,258.8,58.4,258.4,69.7,257.7,80.9,256.3,92.0,254.1,113.7,247.9,134.0,239.3,139.0,231.3,142.5,224.0,145.8,214.7,147.7,206.2,148.7,195.8,148.3,185.1,139.1,149.7,130.2,122.6,120.3,97.3,109.4,73.2,99.4,53.8,82.9,24.3,143.1,0.0,223.3,159.0]],"B":[385.4,479.7,[385.4,49.6,385.4,479.7,0.0,479.7,0.0,266.2,24.3,269.3,45.6,270.4,66.8,270.5,84.9,268.5,102.5,264.3,119.4,257.9,129.8,252.6,140.5,246.1,146.5,236.0,151.4,223.2,153.5,213.1,154.2,202.9,153.3,192.0,154.1,150.4,152.8,117.7,150.6,93.5,146.8,64.4,143.4,45.1,135.8,9.4,194.7,0.0,211.9,14.4,223.9,22.8,236.7,30.2,250.1,36.4,263.9,41.5,278.1,45.4,292.6,48.1,307.7,49.6]]}};
  const FIXED_SIZES={
    label:'Published paired size',
    default:'8/10',
    combinedSizes:true,
    seamAllowanceMM:12.7,
    seamAllowanceText:'The original 1/2-inch seam allowance is included on sewn edges; place-on-fold edges have none.',
    unit:'in',
    fitNote:'Make a test bodice before cutting fashion fabric; the elastic waist and ribbon-laced front provide the intended adjustment.',
    measurementLabels:{neck:'Body neck',bust:'Body bust',waist:'Body waist',hips:'Body hips'},
    entries:SIZE_ROWS.map(row=>({
      id:row.id,
      chartSize:row.chartSize,
      measurements:{neck:row.neck,bust:row.bust,waist:row.waist,hips:row.hips}
    }))
  };
  const sizeRow=value=>SIZE_ROWS.find(row=>row.id===String(value))||SIZE_ROWS.find(row=>row.id===FIXED_SIZES.default);

  const GUIDE=`## Before sewing

- Select one of the eight paired publisher cut lines. A 1/2-inch seam allowance is included on sewn edges; place-on-fold edges have none.
- Cut front bodice A and back bodice B from fashion fabric and lining. Cut puff sleeve C and sleeve band D twice. Cut half-circle skirt E twice on the fold from fashion fabric and twice on the fold from lining.
- Transfer every piece letter, S shoulder mark, U underarm/sleeve mark, W waist mark, gather mark, fold line, and ribbon-casing line.
- For each 1/2-inch French seam, sew 1/4 inch with wrong sides together, trim and press, then sew 1/4 inch with right sides together.

## 1. Treat the bodice layers as one (A and B)

Baste each fashion-fabric bodice piece to its matching lining piece inside the seam allowance. From this point, handle each basted pair as one layer.

## 2. Join the bodice (A to B)

Match the S shoulder marks and U side/underarm marks. Sew front bodice A to back bodice B at the shoulders and side seams with French seams. Leave the center-front ribbon edges open.

## 3. Finish the geometric lower edge

Turn the angled lower edge of bodice A and the matching lower edge of B to the wrong side and stitch a narrow hem. Clip only where needed so the point lies flat.

## 4. Assemble the skirt and lining (E)

With two skirt E pieces for each layer, join the center-back seam of the fashion skirt with a French seam. Repeat for the lining skirt. Keep the two completed layers separate and leave their fold edges unsewn.

## 5. Sandwich the bodice at the waist (A, B, and E)

Place the bodice between the skirt and lining, matching W marks, side seams, and center points. Sew the waist seam, trim the allowance evenly, then turn the skirt and lining downward.

## 6. Make the elastic waist casing

Stitch around the waist again to form a casing. Cut elastic approximately 2 inches shorter than the wearer's waist, thread it through the casing, overlap and secure the ends, then close the opening.

## 7. Sew and set the puff sleeves (C)

Sew each sleeve C inseam with a French seam. Gather the sleeve cap between the S marks, match U at the underarm, and set the sleeve into the armhole without gathering below the marked range.

## 8. Add sleeve bands (C and D)

Join the short ends of sleeve band D. Gather the lower edge of sleeve C to the band, sew, then turn the band inward and finish the inner edge. Lining the band is optional.

## 9. Hem the skirt and neckline

Let both skirt layers hang before leveling them. Finish each skirt layer and the neckline with a 1/4-inch rolled hem.

## 10. Form and lace the ribbon casing (A)

At each center-front edge of A, turn 1/2 inch inward twice and edge-stitch to form the ribbon casing. Feed ribbon from the bottom upward through both casings, adjust the opening comfortably, and tie at the top.`;

  const CONFIG={measurements:[],optionalMeasurements:[],options:{}};
  const ABOUT={
    name:'Puff-Sleeve Tie-Front Dress',
    description:'A fit-and-flare dress with puff sleeves, a ribbon-laced tie-front bodice, geometric midriff opening, elastic waist, and lined half-circle skirt.',
    difficulty:3,
    yardage:'4-5 yd',
    tags:['dresses','costumes'],
    techniques:['puff-sleeves','lining','french-seams','elastic-casing','rolled-hems','ribbon-casing'],
    illustration:'illustrations/bluebell.svg',
    sourceUrl:SOURCE,
    sourceLabel:'Based on the linked publisher pattern',
    generated:true,
    fixedSizing:true
  };

  const fmt=value=>Number(Number(value).toFixed(2));
  const xml=value=>String(value==null?'':value).replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[char]));

  function line(x1,y1,x2,y2,cls='mark'){
    return '<line class="'+cls+'" x1="'+fmt(x1)+'" y1="'+fmt(y1)+'" x2="'+fmt(x2)+'" y2="'+fmt(y2)+'"/>';
  }
  // Match marks begin on the stitch line and point into the piece. Keeping the
  // entire mark (including its letter) on the seam's inner edge means it
  // remains legible after the outer cut line is removed.
  function notch(x,y,inwardAngle=90,label=''){
    const length=6,rad=inwardAngle*Math.PI/180,dx=Math.cos(rad)*length,dy=Math.sin(rad)*length;
    const labelX=x+Math.cos(rad)*11,labelY=y+Math.sin(rad)*11+1.7;
    return line(x,y,x+dx,y+dy,'notch')+(label?'<text class="seam-letter" text-anchor="middle" x="'+fmt(labelX)+'" y="'+fmt(labelY)+'">'+xml(label)+'</text>':'');
  }
  function grain(x,y,length){
    return '<g class="grain">'+line(x,y,x,y+length,'grain-line')+
      '<path d="M '+fmt(x)+' '+fmt(y)+' l -4 8 h 8 z M '+fmt(x)+' '+fmt(y+length)+' l -4 -8 h 8 z"/>'+
      '<text x="'+fmt(x+7)+'" y="'+fmt(y+length/2)+'" transform="rotate(90 '+fmt(x+7)+' '+fmt(y+length/2)+')">GRAINLINE</text></g>';
  }
  function crossGrain(x,y,length){
    return '<g class="grain">'+line(x,y,x+length,y,'grain-line')+
      '<path d="M '+fmt(x)+' '+fmt(y)+' l 8 -4 v 8 z M '+fmt(x+length)+' '+fmt(y)+' l -8 -4 v 8 z"/>'+
      '<text x="'+fmt(x+length/2)+'" y="'+fmt(y-7)+'" text-anchor="middle">GRAINLINE</text></g>';
  }
  function fold(x,y,length,side='left'){
    const upper=y+length*.27,lower=y+length*.73;
    const sign=side==='right'?-1:1;
    const arrow=at=>'<path class="fold-arrow" d="M '+fmt(x+sign*22)+' '+fmt(at)+' H '+fmt(x+sign*2)+' m 0 0 l '+fmt(sign*7)+' -4 M '+fmt(x+sign*2)+' '+fmt(at)+' l '+fmt(sign*7)+' 4"/>';
    const textX=x+sign*12;
    return '<g class="fold-mark">'+line(x,y,x,y+length,'fold-line')+arrow(upper)+arrow(lower)+
      '<text class="fold-text" x="'+fmt(textX)+'" y="'+fmt(y+length/2)+'" transform="rotate(90 '+fmt(textX)+' '+fmt(y+length/2)+')" text-anchor="middle">PLACE ON FOLD</text></g>';
  }
  function gather(x1,y1,x2,y2,label='GATHER'){
    return line(x1,y1,x2,y2,'gather-line')+'<text class="gather-text" x="'+fmt((x1+x2)/2)+'" y="'+fmt((y1+y2)/2-6)+'" text-anchor="middle">'+xml(label)+'</text>';
  }
  function title(letter,name,cut,x,y,sizeLabel,compact=false){
    const rows=String(cut).split('|');
    if(compact){
      return '<g class="piece-label compact-piece-label" transform="translate('+fmt(x)+' '+fmt(y)+')">'+
        '<text class="compact-piece-number fill-note" x="0" y="0">'+xml(letter)+'</text>'+
        '<text class="piece-name text-lg fill-current" x="20" y="-12">'+xml(name)+'</text>'+
        '<text class="text-sm fill-current" x="20" y="-5">Published size '+xml(sizeLabel)+'</text>'+
        '<text class="pattern-name fill-note" x="20" y="2">Puff-Sleeve Tie-Front Dress</text>'+
        rows.map((row,index)=>'<text class="cut-instruction text-md fill-current" x="20" y="'+(10+index*7)+'">'+xml(row)+'</text>').join('')+'</g>';
    }
    return '<g class="piece-label" transform="translate('+fmt(x)+' '+fmt(y)+')">'+
      '<text class="piece-number text-4xl fill-note" x="0" y="0">'+xml(letter)+'</text>'+
      '<text class="text-sm fill-current" x="24" y="-18">Published size '+xml(sizeLabel)+'</text>'+
      '<text class="piece-name text-lg fill-current" x="24" y="-10">'+xml(name)+'</text>'+
      '<text class="pattern-name fill-note" x="24" y="-2">Puff-Sleeve Tie-Front Dress</text>'+
      rows.map((row,index)=>'<text class="cut-instruction text-md fill-current" x="24" y="'+(7+index*7)+'">'+xml(row)+'</text>').join('')+'</g>';
  }
  function piece(id,letter,name,w,h,body){return {id,letter,name,w:fmt(w),h:fmt(h),body};}

  function polygonPath(values,startPair=0,close=true,returnToFirst=false){
    let d='M '+fmt(values[startPair*2])+' '+fmt(values[startPair*2+1]);
    for(let index=(startPair+1)*2;index<values.length;index+=2)d+=' L '+fmt(values[index])+' '+fmt(values[index+1]);
    if(returnToFirst)d+=' L '+fmt(values[0])+' '+fmt(values[1]);
    return d+(close?' Z':'');
  }

  // The PDF supplies cut lines with its 1/2-inch allowance already included.
  // A scaled duplicate provides an instructional stitch line. Fold plates use
  // an open duplicate anchored to the fold, so no stitch segment or allowance
  // is introduced on that edge.
  function sourceGeometry(plate,x,y,folded=false,outerTransform=''){
    const [, ,points]=plate,sa=FIXED_SIZES.seamAllowanceMM;
    const cut=polygonPath(points);
    const seamPoints=insetPolygon(points,sa,folded);
    const stitch=folded?polygonPath(seamPoints,1,false,true):polygonPath(seamPoints);
    const transform=outerTransform||'translate('+fmt(x)+' '+fmt(y)+')';
    return '<g class="source-geometry" transform="'+transform+'"><path class="cut" d="'+cut+'"/><path class="stitch" d="'+stitch+'"/></g>';
  }

  function insidePolygon(x,y,points){
    let inside=false;
    for(let index=0,previous=points.length-2;index<points.length;previous=index,index+=2){
      const xi=points[index],yi=points[index+1],xj=points[previous],yj=points[previous+1];
      if((yi>y)!==(yj>y) && x<(xj-xi)*(y-yi)/(yj-yi)+xi)inside=!inside;
    }
    return inside;
  }

  function insetPolygon(values,distance,folded=false){
    const points=[];
    for(let index=0;index<values.length;index+=2)points.push([values[index],values[index+1]]);
    const count=points.length;
    let area=0;
    for(let index=0;index<count;index++){
      const current=points[index],next=points[(index+1)%count];
      area+=current[0]*next[1]-next[0]*current[1];
    }
    const direction=area>=0?1:-1;
    const edges=points.map((current,index)=>{
      const next=points[(index+1)%count],dx=next[0]-current[0],dy=next[1]-current[1],length=Math.hypot(dx,dy)||1;
      const nx=direction*-dy/length,ny=direction*dx/length;
      return {start:[current[0]+nx*distance,current[1]+ny*distance],end:[next[0]+nx*distance,next[1]+ny*distance]};
    });
    const intersection=(first,second,original)=>{
      const [x1,y1]=first.start,[x2,y2]=first.end,[x3,y3]=second.start,[x4,y4]=second.end;
      const denominator=(x1-x2)*(y3-y4)-(y1-y2)*(x3-x4);
      let point;
      if(Math.abs(denominator)<1e-7)point=[(first.end[0]+second.start[0])/2,(first.end[1]+second.start[1])/2];
      else{
        const ratio=((x1-x3)*(y3-y4)-(y1-y3)*(x3-x4))/denominator;
        point=[x1+ratio*(x2-x1),y1+ratio*(y2-y1)];
      }
      if(Math.hypot(point[0]-original[0],point[1]-original[1])>distance*4 || !insidePolygon(point[0],point[1],values)){
        point=[(first.end[0]+second.start[0])/2,(first.end[1]+second.start[1])/2];
      }
      return point;
    };
    const inset=points.map((point,index)=>intersection(edges[(index-1+count)%count],edges[index],point));
    if(folded){
      const foldX=Math.max(...points.map(point=>point[0]));
      const atFold=edge=>{
        const dx=edge.end[0]-edge.start[0];
        return [foldX,Math.abs(dx)<1e-7?(edge.start[1]+edge.end[1])/2:edge.start[1]+(foldX-edge.start[0])*(edge.end[1]-edge.start[1])/dx];
      };
      inset[0]=atFold(edges[count-1]);
      inset[1]=atFold(edges[1]);
    }
    return inset.flat();
  }

  function edgeNotch(plate,x,y,targetX,targetY,label,folded=false){
    const [, ,points]=plate,seamPoints=insetPolygon(points,FIXED_SIZES.seamAllowanceMM,folded);
    let pair=0,distance=Infinity;
    for(let index=0;index<seamPoints.length;index+=2){
      const current=(seamPoints[index]-targetX)**2+(seamPoints[index+1]-targetY)**2;
      if(current<distance){distance=current;pair=index/2;}
    }
    const count=seamPoints.length/2,previous=(pair-1+count)%count,next=(pair+1)%count;
    const point=[seamPoints[pair*2],seamPoints[pair*2+1]];
    const before=[seamPoints[previous*2],seamPoints[previous*2+1]];
    const after=[seamPoints[next*2],seamPoints[next*2+1]];
    const tangent=Math.atan2(after[1]-before[1],after[0]-before[0])*180/Math.PI;
    const candidates=[tangent+90,tangent-90];
    const angle=candidates.find(value=>{
      const radians=value*Math.PI/180;
      return insidePolygon(point[0]+Math.cos(radians)*14,point[1]+Math.sin(radians)*14,points);
    })||candidates[0];
    return notch(x+point[0],y+point[1],angle,label);
  }

  function buildPieces(settings){
    const row=sizeRow(settings&&settings.options&&settings.options.publishedSize);
    const plates=SOURCE_PLATES[row.id],sa=FIXED_SIZES.seamAllowanceMM,edge=8;
    const label=(letter,name,cut,x,y,compact=false)=>title(letter,name,cut,x,y,row.id,compact);
    const pieces=[];

    // A - source wrap-front silhouette, including the long crossing extension.
    {
      const plate=plates.A,bw=plate[0],bh=plate[1],w=bw+2*edge,h=bh+2*edge,x=edge,y=edge;
      const casingX=x+bw*.80,casingY=y+bh*.69;
      const casing='<path class="casing-line" d="M '+fmt(x+bw*.91)+' '+fmt(y+bh*.50)+' L '+fmt(x+bw*.68)+' '+fmt(y+bh*.91)+'"/>'+
        '<text class="casing-text" x="'+fmt(casingX)+'" y="'+fmt(casingY)+'" transform="rotate(119 '+fmt(casingX)+' '+fmt(casingY)+')" text-anchor="middle">RIBBON CASING</text>';
      pieces.push(piece(1,'A','Front Bodice',w,h,
        sourceGeometry(plate,x,y)+casing+grain(x+bw*.56,y+bh*.55,bh*.24)+
        edgeNotch(plate,x,y,bw*.15,bh*.04,'S')+edgeNotch(plate,x,y,bw*.21,bh*.43,'U')+edgeNotch(plate,x,y,bw*.35,bh*.98,'W')+
        label('A','Front Bodice','Cut 2|Fabric + lining',x+bw*.12,y+bh*.78)));
    }

    // B - exact half-back silhouette; the right vertical edge is the fold.
    {
      const plate=plates.B,bw=plate[0],bh=plate[1],points=plate[2],foldY=points[1],w=bw+2*edge,h=bh+2*edge,x=edge,y=edge;
      pieces.push(piece(2,'B','Back Bodice',w,h,
        sourceGeometry(plate,x,y,true)+fold(x+bw,y+foldY,bh-foldY,'right')+grain(x+bw*.68,y+bh*.44,bh*.25)+
        edgeNotch(plate,x,y,bw*.43,bh*.03,'S',true)+edgeNotch(plate,x,y,bw*.18,bh*.49,'U',true)+edgeNotch(plate,x,y,bw*.27,bh*.98,'W',true)+
        label('B','Back Bodice','Cut 2 on fold|Fabric + lining',x+bw*.20,y+bh*.73)));
    }

    // C - the source's tall crescent sleeve: cap on the outer curve and cuff on
    // the long inner edge. This was previously represented as a short oval.
    {
      const plate=plates.C,sw=plate[0],sh=plate[1],w=sw+2*edge,h=sh+2*edge,x=edge,y=edge;
      const capGather='<path class="gather-line" d="M '+fmt(x+sw*.78)+' '+fmt(y+sh*.31)+' C '+fmt(x+sw*.93)+' '+fmt(y+sh*.40)+' '+fmt(x+sw*.94)+' '+fmt(y+sh*.59)+' '+fmt(x+sw*.74)+' '+fmt(y+sh*.70)+'"/>'+
        '<text class="gather-text" x="'+fmt(x+sw*.76)+'" y="'+fmt(y+sh*.50)+'" transform="rotate(90 '+fmt(x+sw*.76)+' '+fmt(y+sh*.50)+')" text-anchor="middle">GATHER CAP S TO S</text>';
      const cuffGather=line(x+17,y+sh*.24,x+17,y+sh*.76,'gather-line')+
        '<text class="gather-text" x="'+fmt(x+28)+'" y="'+fmt(y+sh*.50)+'" transform="rotate(90 '+fmt(x+28)+' '+fmt(y+sh*.50)+')" text-anchor="middle">GATHER TO D</text>';
      pieces.push(piece(3,'C','Puff Sleeve',w,h,
        sourceGeometry(plate,x,y)+crossGrain(x+sw*.22,y+sh*.39,sw*.52)+capGather+cuffGather+
        edgeNotch(plate,x,y,sw*.91,sh*.36,'S')+edgeNotch(plate,x,y,sw*.91,sh*.64,'S')+
        edgeNotch(plate,x,y,sw*.34,sh*.09,'U')+edgeNotch(plate,x,y,sw*.34,sh*.91,'U')+
        label('C','Puff Sleeve','Cut 2|Fashion fabric',x+sw*.27,y+sh*.58)));
    }

    // D - exact 3-inch-wide source rectangle, rotated on the marker only.
    {
      const plate=plates.D,bandW=plate[1],bandH=plate[0],w=bandW+2*edge,h=bandH+2*edge,x=edge,y=edge;
      const rotated='translate('+fmt(x+bandW)+' '+fmt(y)+') rotate(90)';
      pieces.push(piece(4,'D','Sleeve Band',w,h,
        sourceGeometry(plate,0,0,false,rotated)+grain(x+35,y+10,bandH-20)+notch(x+bandW*.50,y+sa,90,'U')+
        label('D','Sleeve Band','Cut 2 fabric|Lining optional',x+bandW*.30,y+bandH*.52,true)));
    }

    // E - exact quarter-circle source plate; cutting two on the right-hand fold
    // opens each copy into one of the original half-circle skirt panels.
    {
      const plate=plates.E,skirtW=plate[0],skirtH=plate[1],points=plate[2],foldY=points[1],w=skirtW+2*edge,h=skirtH+2*edge,x=edge,y=edge;
      const testX=x+skirtW*.68,testY=y+skirtH*.62;
      const calibration='<g class="calibration-group" transform="translate('+fmt(testX)+' '+fmt(testY)+')"><rect class="calibration-clear" x="-7" y="-7" width="39.4" height="49"/><rect class="calibration" width="25.4" height="25.4"/><text class="calibration-text" x="12.7" y="32.5" text-anchor="middle">1 IN TEST</text><text class="calibration-text" x="12.7" y="38" text-anchor="middle">25.4 MM</text></g>';
      const sideTopX=Math.max(...points.filter((value,index)=>index%2===0&&points[index+1]===0));
      const waistGather='<path class="gather-line" d="M '+fmt(x+sideTopX-35)+' '+fmt(y+18)+' C '+fmt(x+sideTopX+18)+' '+fmt(y+foldY*.90)+' '+fmt(x+skirtW-75)+' '+fmt(y+foldY+30)+' '+fmt(x+skirtW-20)+' '+fmt(y+foldY+24)+'"/>'+
        '<text class="gather-text" x="'+fmt(x+skirtW*.83)+'" y="'+fmt(y+foldY+36)+'" text-anchor="middle">MATCH WAIST - ELASTIC CASING</text>';
      const hem='<path class="hem-line" d="M '+fmt(x+skirtW-18)+' '+fmt(y+skirtH-14)+' C '+fmt(x+skirtW*.55)+' '+fmt(y+skirtH-5)+' '+fmt(x+skirtW*.16)+' '+fmt(y+skirtH*.63)+' '+fmt(x+15)+' '+fmt(y+22)+'"/>';
      pieces.push(piece(5,'E','Half-Circle Skirt',w,h,
        sourceGeometry(plate,x,y,true)+fold(x+skirtW,y+foldY,skirtH-foldY,'right')+
        grain(x+skirtW*.36,y+skirtH*.27,skirtH*.30)+waistGather+hem+
        edgeNotch(plate,x,y,sideTopX*.96,20,'W',true)+edgeNotch(plate,x,y,skirtW*.96,foldY*.82,'W',true)+
        label('E','Half-Circle Skirt','Cut 2 on fold from fabric|Cut 2 on fold from lining',x+skirtW*.43,y+skirtH*.42)+calibration));
    }
    return pieces;
  }

  function render(settings){
    const pieces=buildPieces(settings||{});
    const maxWidth=Math.max(500,Math.min(Number(settings&&settings.maxWidth)||900,904.4));
    const gap=10,margin=10,skirt=pieces.find(item=>item.letter==='E');
    if(pieces.some(item=>item.w>maxWidth-2*margin)){
      const item=pieces.find(candidate=>candidate.w>maxWidth-2*margin);
      throw new Error(item.name+' is wider than a 36-inch roll at this published size.');
    }
    skirt.x=margin;skirt.y=margin;
    let y=margin+skirt.h+gap,x=margin,rowH=0;
    pieces.filter(item=>item!==skirt).sort((a,b)=>b.h-a.h||b.w-a.w).forEach(item=>{
      if(x>margin&&x+item.w>maxWidth-margin){x=margin;y+=rowH+gap;rowH=0;}
      item.x=x;item.y=y;x+=item.w+gap;rowH=Math.max(rowH,item.h);
    });
    const placed=[skirt,...pieces.filter(item=>item!==skirt)];
    const width=Math.min(maxWidth,Math.max(500,...placed.map(item=>item.x+item.w+margin)));
    const height=Math.max(...placed.map(item=>item.y+item.h+margin));
    const css=`text{font-size:5px;font-family:-apple-system,system-ui,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;fill:#000;text-anchor:start;font-weight:200;dominant-baseline:ideographic}.cut{fill:white;stroke:#212121;stroke-width:.6;vector-effect:non-scaling-stroke}.stitch{fill:none;stroke:#212121;stroke-width:.4;stroke-dasharray:.4 .8;vector-effect:non-scaling-stroke}.mark,.notch,.gather-line{fill:none;stroke:#3b82f6;stroke-width:.4;vector-effect:non-scaling-stroke}.gather-line{stroke-dasharray:1 1.5}.fold-line,.fold-arrow,.grain-line,.hem-line,.casing-line{fill:none;stroke:#8b5cf6;stroke-width:.4;vector-effect:non-scaling-stroke}.fold-line{stroke-dasharray:15 1.5 1 1.5}.hem-line,.casing-line{stroke-dasharray:1 1.5}.text-sm{font-size:4px}.text-md{font-size:5px}.text-lg{font-size:7px}.text-4xl{font-size:36px}.fill-note,.pattern-name{fill:#8b5cf6}.piece-number{font-size:36px}.compact-piece-number{font-size:24px}.piece-name{font-size:7px}.grain text,.fold-text,.casing-text{font-size:5px;fill:#8b5cf6}.seam-letter,.gather-text{font-size:5px;fill:#3b82f6}.grain path{fill:#8b5cf6;stroke:none}.calibration-clear{fill:white;stroke:none}.calibration{fill:white;stroke:#212121;stroke-width:.6}.calibration-text{font-size:3px;fill:#000}`;
    const groups=placed.map(item=>'<g id="bluebell-stack-'+item.id+'" data-piece="'+item.letter+'" data-width="'+item.w+'" data-height="'+item.h+'" data-layout-x="'+fmt(item.x)+'" data-layout-y="'+fmt(item.y)+'" transform="translate('+fmt(item.x)+' '+fmt(item.y)+')">'+item.body+'</g>').join('');
    return '<svg xmlns="http://www.w3.org/2000/svg" width="'+fmt(width)+'mm" height="'+fmt(height)+'mm" viewBox="0 0 '+fmt(width)+' '+fmt(height)+'"><style>'+css+'</style><rect width="100%" height="100%" fill="white"/>'+groups+'</svg>';
  }

  window.PatternGenerators=window.PatternGenerators||{};
  window.PatternGenerators.bluebell={about:ABOUT,config:CONFIG,instructions:GUIDE,i18n:{},fixedSizes:FIXED_SIZES,render};
})();
