import {WaltzWidget} from "@waltz-controls/middleware";
import {kPiAxisController, kPiAxisControllerCtx, kPiAxisUpdateMotor} from "controllers/pi_controller";
import {kCrystalsWidget, kToggleMotorVisibility} from "widgets/crystals";
import {getCrystalId} from "utils";

const kFindAll = () => true;

export const kMotorsWidget = "widget:motor";

export default class MotorsWidget extends WaltzWidget {
    constructor(app) {
        super(kMotorsWidget, app);

        this.listen(payload => {
            this.view.updateItem(payload.id, payload)

            this.view.filter(item => item.visible)
        }, kToggleMotorVisibility, kCrystalsWidget)

        this.listen(motor => {
            const {position, servo, reference} = motor;
            this.view.updateItem(`${motor.controllerId}:${getCrystalId(motor.id, motor.controllerId)}:${motor.id}`, {
                position,
                servo,
                reference
            })
        }, kPiAxisUpdateMotor, kPiAxisController)
    }

    ui() {
        return {
            view: "datatable",
            id: "motors",
            editable: true,
            columns: [
                {
                    id: "id", header: "Motor", width: 150, template(obj) {
                        const [ctrlId, crstlId, motorId] = obj.id.split(':');
                        return `<strong>Crystal ${crstlId}</strong> Motor ${motorId}`;
                    }
                },
                {id: "position", header: "Position", width: 240, editor: "text"},
                {
                    id: "set", header: "", template(obj) {
                        return `<div class='webix_el_button set webix_base'><button class="webix_button">Set</button></div>`
                    }, width: 80
                },
                {
                    id: "home", header: "", width: 100, template() {
                        return `<div class='webix_el_button home webix_primary'><button class="webix_button">Home</button></div>`
                    }
                },
                {
                    id: "stop", header: "", width: 100, template() {
                        return `<div class='webix_el_button stop webix_danger'><button class="webix_button">Stop</button></div>`
                    }
                },
                {
                    id: "refresh", header: "", width: 100, template() {
                        return `<div class='webix_el_button refresh webix_base'><button class="webix_button">Refresh</button></div>`
                    }
                },
                {id: "dummy", header: "", fillspace: true}
            ],
            onClick: {
                "set": (ev, id) => {
                    const [ctrlId, crstlId, motorId] = id.row.split(':')
                    this.view.editStop();
                    const target = parseFloat(this.view.getItem(id.row).position);
                    const controller = this.app.getController(`magix.${ctrlId}`);
                    controller
                        .move({
                            [motorId]: target
                        })
                },
                "home": (ev, id) => {
                    const [ctrlId, crstlId, motorId] = id.row.split(':')
                    const controller = this.app.getController(ctrlId);
                    controller
                        .home([motorId])
                },
                "stop": (ev, id) => {
                    const [ctrlId, crstlId, motorId] = id.row.split(':')
                    const controller = this.app.getController(ctrlId);
                    controller
                        .stop([motorId])
                },
                "refresh": (ev, id) => {
                    const [ctrlId, crstlId, motorId] = id.row.split(':')
                    const controller = this.app.getController(ctrlId);
                    controller.position()
                }
            }
        }
    }

    get view() {
        return $$('motors');
    }

    async run() {
        const controllers = await this.app.getContext(kPiAxisControllerCtx);

        this.view.clearAll();
        this.view.parse(
            controllers
                .flatMap((controller, ndx) =>
                    controller.motors.find(kFindAll).map(motor => ({
                        ...motor,
                        id: `${controller.id}:${getCrystalId(motor.id, ndx)}:${motor.id}`,
                        visible: true
                    })))
        )
    }
}