from handlers.basic_test_handler import BasicTestHandler


class AbTestHandler(BasicTestHandler):
    def prepare(self):
        self.user_id = self.auth_current_user()
        self.current_db = self.db['abTests']
