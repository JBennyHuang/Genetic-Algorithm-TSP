import logo from './logo.svg';
import './App.css';

import { Graph } from "react-d3-graph";
import { useEffect, useState, useRef } from "react"
import { ButtonGroup, Button, Container, Grid, Slider, Typography } from '@material-ui/core';
import { sqrt, pow, random, randomInt, cross} from 'mathjs';
import { shuffle } from 'd3';
import { LineChart, XAxis, YAxis, Line } from 'recharts'
import { useSetInterval } from './hooks/useSetInterval'

class randomGraphGenerator {
  constructor(n, num_nodes) {
    this.n = n
    this.num_nodes = num_nodes
    this.nodes = []
    this.edges = []
    this.samples = []
    this.best_dist = null
  }

  init() {
    for (let i = 0; i < this.num_nodes; i ++) {
      this.nodes.push({
        id: this.nodes.length,
        x: random(10,490),
        y: random(10,490)
      })
    }
    
    return this.nodes
  }

  step(population, crossover, mutation) {
    let vector = []

    for (let i = 0; i < this.num_nodes; i ++) {
      vector.push(i)
    }
    
    for (let i = this.samples.length; i < population; i ++) {
      shuffle(vector)
      this.samples.push(Array.from(vector))
    }

    // Sorting
    let samples_with_dist_and_edges = []

    for (let i = 0; i < population; i ++) {
      let dist = 0
      let edges = []

      for (let j = 0; j < this.num_nodes; j ++) {
        let delta_x
        let delta_y

        if (j == this.num_nodes - 1) {
          delta_x = this.nodes[this.samples[i][j]].x - this.nodes[this.samples[i][0]].x
          delta_y = this.nodes[this.samples[i][j]].y - this.nodes[this.samples[i][0]].y
          edges.push({
            source: this.nodes[this.samples[i][j]].id, 
            target: this.nodes[this.samples[i][0]].id
          })
        } else {
          delta_x = this.nodes[this.samples[i][j]].x - this.nodes[this.samples[i][j+1]].x
          delta_y = this.nodes[this.samples[i][j]].y - this.nodes[this.samples[i][j+1]].y
          edges.push({
            source: this.nodes[this.samples[i][j]].id, 
            target: this.nodes[this.samples[i][j+1]].id
          })
        }

        dist = dist + sqrt(pow(delta_x, 2) + pow(delta_y, 2))
      }

      samples_with_dist_and_edges.push({
        sample: this.samples[i],
        dist: dist,
        edges: edges
      })
    }

    samples_with_dist_and_edges.sort((a, b) => {
      if (a.dist > b.dist) {
        return -1
      } else if ( a.dist < b.dist) {
        return 1
      } else {
        return 0
      }
    })

    // if (!this.best_dist || samples_with_dist_and_edges[0].dist > this.best_dist) {
    //   this.best_dist = samples_with_dist_and_edges[0].dist
    //   this.edges = samples_with_dist_and_edges[0].edges
    // } 

    this.best_dist = samples_with_dist_and_edges[0].dist
    this.edges = samples_with_dist_and_edges[0].edges

    // Pruning 

    let keep_samples = []

    for (let i = 0; i < population; i ++) {
      let rank = ( population - i) / population
      if  (rank > random(0, 1)) {
        keep_samples.push(Array.from(this.samples[i]))
      }
    }

    // this.samples = keep_samples

    // for (let i = this.samples.length; i < population; i ++) {
    //   shuffle(vector)
    //   this.samples.push(Array.from(vector))
    // }

    // Crossover

    let new_samples = []

    for (let i = 0; i < keep_samples.length; i ++) {
      for (let j = i+1; j < keep_samples.length; j ++) {
        if (crossover > random(0, 1)) {
          let new_sample = []

          let start = randomInt(0, this.num_nodes)
          let end = randomInt(start, this.num_nodes)

          let hash = Array.of(this.num_nodes)
        
          for (let k = 0; k < this.num_nodes; k ++) {
            if (start <= k && k < end) {
              new_sample.push(keep_samples[i][k])
              hash[keep_samples[i][k]] = true
            } else {
              new_sample.push(-1)
              hash[keep_samples[i][k]] = false
            }
          }


          let k = 0;
          let l = 0;
          while (k != this.num_nodes) {
            if (new_sample[k] == -1) {
              if (hash[keep_samples[j][l]] == false) {
                new_sample[k] = keep_samples[j][l]
                l ++
              } else {
                l ++
              }
            } else {
              k ++
            }
          }

          new_samples.push(new_sample)
        }

        if (new_samples.length >= population) {
          break
        }
      }
      if (new_samples.length >= population) {
        break
      }
    }

    this.samples = new_samples

    for (let i = this.samples.length; i < population; i ++) {
      shuffle(vector)
      this.samples.push(Array.from(vector))
    }

    // Mutation
    
    for (let i = 0; i < population; i ++) {
      if (mutation > random(0, 1)) {
        let u = randomInt(0, this.num_nodes)
        let v = randomInt(u, this.num_nodes)

        let place = this.samples[i][u]
        this.samples[i][u] = this.samples[i][v]
        this.samples[i][v] = place
      }
    }

    return [this.edges, this.best_dist]
  }

  reset() {
     
  }  
}


function App() {
  const [nodes, setNodes] = useState([{id:-1, x:-50, y:-50}])
  const [edges, setEdges] = useState([])
  const [fitness, setFitness] = useState([])
  const [gridSize, setGridSize] = useState(5)
  const [numNodes, setNumNodes] = useState(1)
  const [randomGraph, setRandomGraph] = useState(null)
  const [play, setPlay] = useState(false)
  const [population, setPopulation] = useState(5000)
  const [crossover, setCrossover] = useState(0.3)
  const [mutation, setMutation] = useState(0)
  const [populationC, setPopulationC] = useState(population)
  const [crossoverC, setCrossoverC] = useState(crossover)
  const [mutationC, setMutationC] = useState(mutation)

  const onChangeSliderGridSize = (event, newValue) => {
    setGridSize(newValue)
  } 

  const onChangeSliderNumNodes = (event, newValue) => {
    setNumNodes(newValue)
  }

  const onChangeSliderCommittedGridSize = (event, newValue) => {
    setFitness([])
    setEdges([])
    setNodes([{id:-1, x:-50, y:-50}])
    setRandomGraph(new randomGraphGenerator(newValue, numNodes))
  }

  const onChangeSliderCommittedNumNodes = (event, newValue) => {
    setFitness([])
    setEdges([])
    setNodes([{id:-1, x:-50, y:-50}])
    setRandomGraph(new randomGraphGenerator(gridSize, newValue))
  }

  const onChangeSliderPopulation = (event, newValue) => {
    setPopulation(newValue)
  }

  const onChangeSliderCrossover = (event, newValue) => {
    setCrossover(newValue)
  }

  const onChangeSliderMutation = (event, newValue) => {
    setMutation(newValue)
  }

  const onChangeSliderCommittedPopulation = (event, newValue) => {
    setPopulationC(newValue)
  }

  const onChangeSliderCommittedCrossover = (event, newValue) => {
    setCrossoverC(newValue)
  }

  const onChangeSliderCommittedMutation = (event, newValue) => {
    setMutationC(newValue)
  }

  useEffect(() => {
    if (randomGraph) {
      setNodes(randomGraph.init())
    }
  }, [randomGraph])

  const onClickButtonStep = (event) => {
    setEdges([])
    if (randomGraph) {
      let [_edges, _fitness] = randomGraph.step(populationC, crossoverC, mutationC)
      setFitness(fitness.concat({x:fitness.length, y:_fitness}))
      setEdges(_edges)
    }
  }

  const onClickButtonPlayPause = (event) => {
    if (play) {
      setPlay(false)
    } else {
      setPlay(true)
    }
  }
  
  useSetInterval(() => {
    setEdges([])
    if (randomGraph) {
      let [_edges, _fitness] = randomGraph.step(populationC, crossoverC, mutationC)
      setFitness(fitness.concat({x:fitness.length+1, y:_fitness}))
      setEdges(_edges)
    }
  }, 100, play)

  return (
    <Container>
      <Grid container spacing={3}>
        <Grid container justify="center" item xs={6}>
            <Graph  id="graph"
                    data={{
                      nodes: nodes,
                      links: edges
                    }}
                    config={{
                      width: 500,
                      height: 500,
                      staticGraph: true,
                    }} />
        </Grid>
        <Grid container justify="center" item xs={6}>
          <LineChart width={730} height={500} data={fitness}
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <XAxis />
            <YAxis />
            <Line dataKey="y" stroke="#8884d8" />
          </LineChart>
        </Grid>
        <Grid container item xs={6}>
          <Typography gutterBottom>
            Grid Size
          </Typography>
          <Slider
            value={gridSize}
            min={1}
            max={10}
            step={1}
            onChange={onChangeSliderGridSize}
            onChangeCommitted={onChangeSliderCommittedGridSize}
            valueLabelDisplay="auto"
          />
          </Grid>
        <Grid container item xs={6}>
          <Typography gutterBottom>
            Num Nodes
          </Typography>
          <Slider
            value={numNodes}
            min={1}
            max={gridSize*gridSize}
            step={1}
            onChange={onChangeSliderNumNodes}
            onChangeCommitted={onChangeSliderCommittedNumNodes}
            valueLabelDisplay="auto"
          />
        </Grid>
        <Grid container justify="center" item xs={12}>
          <ButtonGroup color="primary" aria-label="outlined primary button group">
            <Button onClick={onClickButtonPlayPause}>Play / Pause</Button>
            <Button onClick={onClickButtonStep}>Step</Button>
            <Button>Reset</Button>
          </ButtonGroup>
        </Grid>
        <Grid container item xs={12}>
          <Typography gutterBottom>
            Population
          </Typography>
          <Slider
            value={population}
            min={100}
            max={10000}
            step={100}
            onChange={onChangeSliderPopulation}
            onChangeCommitted={onChangeSliderCommittedPopulation}
            valueLabelDisplay="auto"
          />
        </Grid>
        <Grid container item xs={12}>
          <Typography gutterBottom>
            Crossover
          </Typography>
          <Slider
            value={crossover}
            min={0}
            max={1}
            step={0.01}
            onChange={onChangeSliderCrossover}
            onChangeCommitted={onChangeSliderCommittedCrossover}
            valueLabelDisplay="auto"
          />
        </Grid>
        <Grid container item xs={12}>
          <Typography gutterBottom>
            Mutation
          </Typography>
          <Slider
            value={mutation}
            min={0}
            max={1}
            step={0.01}
            onChange={onChangeSliderMutation}
            onChangeCommitted={onChangeSliderCommittedMutation}
            valueLabelDisplay="auto"
          />
        </Grid>
      </Grid>
    </Container>
  );
}

export default App;
