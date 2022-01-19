import Phaser from '../lib/phaser.js'

export default class GameOver extends Phaser.Scene {

    constructor() {
        super('game-over') // chave unica da scene
    }

    create() {
        // adicionando a frase "Game Over"
        const width = this.scale.width
        const height = this.scale.height
        this.add.text(width * 0.5, height * 0.5, 'Game Over', {fontSize: 48})
            .setOrigin(0.5)

        // play again
        this.input.keyboard.once('keydown-SPACE', () => {
            this.scene.start('game')
        })
    }
}