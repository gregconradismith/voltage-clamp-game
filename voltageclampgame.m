% voltage clamp quiz
function voltage_clamp_game
! rm figures/*

clear
close all
clc
set(0,'DefaultTextFontName','Courier') % Sets Font Style
s = RandStream('mt19937ar','Seed','shuffle');
RandStream.setGlobalStream(s);
set(0,'defaultaxesfontsize',20);

v = -150:0.1:150;
imax = 250; imin=-imax;
t = 0:0.1:500; t = t(:); a = ceil(length(t)/2);

global tau_m v0 v1 vhold vtest reverse

tau_m = 20;
vhold = -100;

erev_list = [ -100 -80 0 60 120 ];
v0_list = [ -60 -40 -20 ];
v1_list = [ 10 20 30 ];
vtest_list = -80:20:40;

color_list = {'b','g','r','c','m','b','g','r','c','m','b','g','r','c','m'};

if rand<-1, reverse=1; else reverse=0; end

for fig=1:1
    close all
    
    erev = erev_list(unidrnd(length(erev_list),1,1));
    v0 = v0_list(unidrnd(length(v0_list),1,1));
    v1 = v1_list(unidrnd(length(v1_list),1,1));
    
    figure(1)
    subplot(2,2,2)
    imem=minf(v,v0,v1).*(v-erev);
    imin=min(v-erev); imax=max(v-erev);
    plot(v,imax*minf(v,v0,v1),'LineWidth',2,'Color','b'); hold on;
    plot(v,v-erev,'LineWidth',2,'Color','g'); hold on;
    plot(v,imem,'LineWidth',2,'Color','r'); hold on;
    line([vhold vhold],[imin imax],'LineStyle',':','LineWidth',2,'Color','k'); hold on;
    
  
    for trial = 1:length(vtest_list)
        vtest = vtest_list(trial);
        col = color_list{trial};
        
        minit = minf(vhold,v0,v1)
        [tdummy,m] = ode45(@myode,t,minit);
        
        subplot(2,2,1)
        plot(t,vcom(t),'LineWidth',2,'Color',col); hold on;
        
        subplot(2,2,3)
        
        plot(t,m.*(vcom(t)-erev),'LineWidth',2,'Color',col); hold on;
        
        subplot(2,2,4)
        
        
        plot(vtest,m(a)*(vcom(t(a))-erev),'-o','MarkerSize',5,'Color',col); hold on;
        
        subplot(2,2,2)
        
        line([vtest vtest],[imin imax],'LineStyle',':','LineWidth',2,'Color',col); hold on;
    end
    
    
    %     print(['figures/ivfig_' num2str(fig) 'B' ],'-dpdf')
    
end
end

function [ dmdt ] = myode(t,m)
global tau_m v0 v1

dmdt = -(m-minf(vcom(t),v0,v1))/tau_m;
end

function [ answer ] = minf(v,v0,v1)
global reverse
answer = 0.5*(1+tanh((v-v0)/v1));
if reverse
    answer=1-answer;
end
end

function [ v ] = vcom(t)
global vhold vtest
v = vhold+(vtest-vhold)*heaviside(t-100).*heaviside(400-t);
end
