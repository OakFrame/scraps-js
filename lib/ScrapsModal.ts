export class ScrapsModal {
    static launch = (d) => {
        return new Promise((res, rej) => {

            let m = document.createElement('div');
            m.innerHTML = `
            <div class='inner'><textarea id="content" style="height: 220px;width: 100%;"></textarea>
            <div class="controls"><span class="button primary" id="add">Add</span> <span class="button" style="float:right;" id="cancel">Cancel</span></div></div>
            `;
            m.className = "scraps modal flex align-center";


            document.body.appendChild(m);
            let el = document.getElementById('content');
            /*let scrap = new Scrap(context);
            scrap.load(el);*/

            document.getElementById('add').onclick = () => {
                let v = ((<HTMLTextAreaElement>el).value);
                console.log(v);
                res(JSON.parse(v));
                document.body.removeChild(m);

            }
            document.getElementById('cancel').onclick = () => {

                document.body.removeChild(m);
                rej()
            }


        });
    }

    static edit = (d) => {
        return new Promise((res, rej) => {

            console.log('EDITING LIB', d);

            let m = document.createElement('div');

            let v = JSON.stringify(window['kernelUtils'].cached[d], null, "\t").replace(/</g, "&lt;")
                .replace(/>/g, "&gt;") + "\n";
            m.innerHTML = `
            <div class='inner'><textarea id="content" style="height: 220px;width: 100%;">${v}</textarea>
            <div class="controls"><span class="button primary" id="save">Save</span> <span class="button error" id="delete">Delete</span> <span class="button" id="cancel" style="float:right;">Cancel</span> </div></div>
            `;
            m.className = "scraps modal flex align-center";


            document.body.appendChild(m);
            let el = document.getElementById('content');
            /*let scrap = new Scrap(context);
            scrap.load(el);*/

            document.getElementById('save').onclick = () => {
                let v = ((<HTMLTextAreaElement>el).value);
                // console.log(v);
                res(JSON.parse(v));
                console.log('SAVING', d)
                document.body.removeChild(m);

            }
            document.getElementById('cancel').onclick = () => {

                document.body.removeChild(m);
                rej()
            }


        });
    }
}
