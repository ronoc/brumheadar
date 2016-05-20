# app.R
library(shiny)
library(rjson)

ui <- fluidPage(
#  titlePanel("My Shiny App"),
  numericInput('num', label='Number', value=1),
  # Hide this in a conditional panel
  conditionalPanel(
    label = "Hidden panel",
    condition = "false",
    numericInput('dataPoint', label='Datapoint', value=-1),
    textInput('metric', label='Metric')
  ),
  plotOutput('test')
)

points <- list()

server <- function(input, output) {
  observeEvent(input$dataPoint, {
    if (input$dataPoint >= 0) {
      points[[input$metric]] <<- c(points[[input$metric]], input$dataPoint)
      print(c("Received metric:", input$metric, input$dataPoint))
    }
  })

  invalidate <- reactiveTimer(1000)

  output$test <- renderPlot({
    #url <- 'http://telemetry.xamdev.com:8080/render?format=json&target=carbon.agents.ip-10-199-2-250-a.metricsReceived'
    #raw <- readLines(url, warn='F')

    #rd <- fromJSON(raw)
    #datapoints <- unlist(rd[[1]]$datapoints)
    #values <- datapoints[seq(1,length(datapoints)-1,2)]
    #timestamps <- datapoints[seq(2,length(datapoints),2)]

    d <- isolate(input$dataPoint)
    if (!is.null(d) && d == -1) {
      invalidate()
    }

    if (length(points) > 0) {
      plot(points[[1]])
      lines(points[[1]])
    } else {
      plot.new()
    }
  })
}

shinyApp(ui = ui, server = server)

