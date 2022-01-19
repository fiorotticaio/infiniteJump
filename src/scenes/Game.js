import Phaser from '../lib/phaser.js'

// importando a classe do carrot
import Carrot from '../game/Carrot.js'

export default class Game extends Phaser.Scene {

    // properties

    carrotsCollected = 0

    // criando propriedades da classe (basta escrever o nome)
    /** @type {Phaser.Physics.Arcade.StaticGroup} */
    platforms

    /** @type {Phaser.Physics.Arcade.Sprite} */
    player

    /** @type {Phaser.Types.Input.Keyboard.CursorKeys} */
    cursors


    constructor() {
        super('game') // chave unica da dessa scene
    }


    // metodo executado antes do preload (bom pra inicializar coisas)
    init() {
        this.carrotsCollected = 0
    }


    // metodo utilizado para especificar imagens, sons, e outros assets, apos iniciado o jogo
    preload(){
        // carregando a imagem de fundo
        this.load.image('background', 'assets/bg_layer1.png')
        // (this.load.image('chave', 'caminho'))
        // o "this" eh como o self do python (instancia da classe)

        // carregando a imagem da plataforma
        this.load.image('platform', 'assets/ground_grass.png')

        // carregando a imagem do personagem
        this.load.image('bunny-stand', 'assets/bunny1_stand.png')

        // garregando a imagem do carrot
        this.load.image('carrot', 'assets/carrot.png')

        // carregando imagem do personagem pulando
        this.load.image('bunny-jump', 'assets/bunny1_jump.png')

        // carregando um audio
        this.load.audio('jump', 'assets/sfx/phaseJump1.mp3')

        // carregando os cursores vindo de uma entrada do teclado
        this.cursors = this.input.keyboard.createCursorKeys()
    }


    /** @type {Phaser.Physics.Arcade.Group} */
    carrots

    /** @type {Phaser.GameObjects.Text} */
    carrotsCollectedText


    // metodo chamado quando todos os assets da scene forem carregados
    create() {
        // setando o fator y do scroll a gente impede o "background" de mover para cima e para baixo com a camera
        this.add.image(240, 320, 'background')
            .setScrollFactor(1, 0)
        
        this.add.image(240, 320, 'background')
        // this.add.image(posicaoX, posicaoY, 'chave da imagem')

        // criando um grupo para plataformas que vao sofrer influencia da fisica porem permanecerem estaticas
        this.platforms = this.physics.add.staticGroup()

        // criando 5 plataformas para o grupo
        for(let i = 0; i < 5; ++i){
            const x = Phaser.Math.Between(80, 400) // gera numeros aleatorios entre 80 e 400
            const y = 150*i

            const platform = this.platforms.create(x, y, 'platform')
            platform.scale = 0.5

            const body = platform.body
            body.updateFromGameObject() // atualiza a fisica do objeto se fizermos alguma alteracao (como posicao e escala)
        }

        // criando o bunny (um Sprite: objeto bi ou tridimensional que se move numa tela sem deixar traços de sua passagem)
        this.player = this.physics.add.sprite(240, 320, 'bunny-stand')
            .setScale(0.5)

        // colocando as colisao das plataformas com o player
        this.physics.add.collider(this.platforms, this.player)

        // tirando as colisoes que nao sejam abaixo 
        this.player.body.checkCollision.up = false
        this.player.body.checkCollision.left = false
        this.player.body.checkCollision.right = false

        // fazendo a camera seguir o player
        this.cameras.main.startFollow(this.player)

        // a dead zone eh a area da tela onde a camera nao vai se mexer 
        // (nao acompanha a movimentacao horizontal (width) do player)
        this.cameras.main.setDeadzone(this.scale.width * 1.5)

        // criando uma carrot
        const carrot = new Carrot(this, 240, 320, 'carrot')
        this.add.existing(carrot)

        this.carrots = this.physics.add.group({
            classType: Carrot
        })
        // adicionanco colisao entre platforms e carrots
        this.physics.add.collider(this.platforms, this.carrots)

        // overlap: sobreposiçao
        this.physics.add.overlap(this.player, this.carrots, this.handleCollectCarrot, undefined, this)

        const style = { color: '#000', fontSize: 24 }
        this.carrotsCollectedText = this.add.text(240, 10, 'Carrots: 0', style)
            .setScrollFactor(0)
            .setOrigin(0.5, 0)
    }


    // se refere ao codigo que eh executado a todo frame
    update() {
        const touchingDown = this.player.body.touching.down
        if(touchingDown) {
            this.player.setVelocityY(-300) // velocidade em frames por segundo

            // trocando para o bonequinho pulando
            this.player.setTexture('bunny-jump') 

            // tocando um sonzinho
            this.sound.play('jump')
        }

        if(this.player.body.velocity.y > 0 && this.player.texture.key !== 'bunny-stand') {
            this.player.setTexture('bunny-stand')
        }

        // reaparecer as plataformas conforme vai subindo
        this.platforms.children.iterate(child => {
            /** @type {Phaser.Physics.Arcade.Sprite} */
            const platform = child
            const scrollY = this.cameras.main.scrollY
            if(platform.y >= scrollY + 700) {
                platform.y = scrollY - Phaser.Math.Between(50, 100)
                platform.body.updateFromGameObject()

                // criando uma carrot emcima da plataforma que esta sendo reusada
                this.addCarrotAbove(platform)
            }
        })

        // this.cursors.left.isDown checa se a tecla de movimentacao para a esquerda esta sendo pressionada
        if (this.cursors.left.isDown && !touchingDown) {
            this.player.setVelocityX(-200)
        } else if (this.cursors.right.isDown && !touchingDown) {
            this.player.setVelocityX(200)
        } else {
            this.player.setVelocityX(0)
        }

        // atravessar a parede e aparecer para o outro lado
        this.horizontalWrap(this.player)

        // game over
        const bottomPlatform = this.findBottomMostPlatform()
        if (this.player.y > bottomPlatform.y + 200) {
            this.scene.start('game-over')
        }
    }


    /**
    * @param {Phaser.GameObjects.Sprite} sprite
    */
    horizontalWrap(sprite) {
        const gameWidth = this.scale.width
        if (sprite.x < 0) {
            // sprite.x eh a posiçao em x do sprite na tela
            sprite.x = gameWidth
        } else if (sprite.x > gameWidth) {
            sprite.x = 0
        }
    }


    addCarrotAbove(sprite) {
        const y = sprite.y - sprite.displayHeight

        /** @type {Phaser.Physics.Arcade.Sprite} */
        const carrot = this.carrots.get(sprite.x, y, 'carrot')

        // setando como ativo e visivel
        carrot.setActive(true)
        carrot.setVisible(true)

        this.add.existing(carrot)

        // atualizando a fisica do tamanho da carrot
        carrot.body.setSize(carrot.width, carrot.height)

        // garantindo que a fisica do jogo esta aplicada
        this.physics.world.enable(carrot)

        return carrot
    }


    /**
    * @param {Phaser.Physics.Arcade.Sprite} player
    * @param {Carrot} carrot
    */
    handleCollectCarrot(player, carrot) {
        // desativa e esconde da tela
        this.carrots.killAndHide(carrot)
        // desabilitando a fisica
        this.physics.world.disableBody(carrot.body)

        this.carrotsCollected++

        // criando um novo valor de texto e setando ele
        const value = `Carrots: ${this.carrotsCollected}` // construindo a nova frase
        this.carrotsCollectedText.text = value
    }


    findBottomMostPlatform() {
        const platforms = this.platforms.getChildren() // pegando todas as plataformas como um vetor
        let bottomPlatform = platforms[0]

        for (let i = 1; i < platforms.length; ++i) {
            const platform = platforms[i]
            // descartando todas as plataformas que estão acima da atual
            if (platform.y < bottomPlatform.y) {
                continue
            }
            bottomPlatform = platform
        }
        return bottomPlatform
    }
}