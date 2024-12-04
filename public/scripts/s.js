
function showDetail(id) {
    const elem = document.getElementById(`${id}-div`);
    const des = document.getElementById(`${id}-des`);
    if(des.classList.contains('hidden')){
        des.classList.remove('hidden');
    }
    else{
        des.classList.add('hidden');
    }

    console.log(elem);

}