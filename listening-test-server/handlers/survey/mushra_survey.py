from handlers.survey.acr_survey import AcrSurveyHandler


class MushraSurveyHandler(AcrSurveyHandler):
    def prepare(self):
        self.test_name = 'mushra'
