import csv
import os
from datetime import datetime

import pymongo
from bson import ObjectId

from handlers.base import BaseHandler
from handlers.download_csv.acr_test_csv_download import check_is_timed, build_tags, build_header


class ApeTestCsvDownload(BaseHandler):
    """
    Write blank columns for header. Try to group all medias files together below a header.
    """

    async def prepare(self):
        self.user_id = await self.auth_current_user()

    async def get(self):
        # Get responses, based on 1 test
        test_id = self.get_argument('testId')
        data = self.db['apeSurveys'].find(
            await self.overwrite_query_params({'userId': self.user_id, 'testId': ObjectId(test_id)})
        ).sort('createdAt', pymongo.DESCENDING)
        # If there is no data here
        if data.count() == 0:
            self.set_error(404, 'There is no enough Ape Test responses')
            return

        # Build file name with test type and datetime
        csv_name = f"ape_Test-{datetime.now().strftime('%Y%m%d%H%M%S%f')}.csv"
        csv_filename = os.path.join(os.getcwd(), 'static2', csv_name)
        # Set http response header for downloading file
        self.set_header('Content-Type', 'application/octet-stream')
        self.set_header('Content-Disposition', f'attachment; filename="{csv_name}"')

        # Set build csv and write
        is_header_writen = False
        with open(csv_filename, 'w', newline='',encoding='utf8') as f:
            writer = csv.writer(f, quoting=csv.QUOTE_ALL)
            for row in data:
                if not is_header_writen:
                    # Tags header: replace , for |. Add extra , for Comment field
                    tag_list = []
                    for x in row['items']:
                        t = build_tags(x)
                        if t is not None:
                            tag_list.append(t)
                            # Give medias spaces
                            if x['type'] == 2:  # Example
                                if 'example' in x and 'medias' in x['example']:
                                    tag_list += [''] * (len(x['example']['medias']) - 1)
                            # Check if it is timed
                            if check_is_timed(row):
                                tag_list.append('')
                    # Tags label + blanks + tags for examples + next row
                    writer.writerow(['', 'Tags'] + tag_list)

                    # Additional row for medias' names
                    audio_names = ['', 'Sound filename']
                    # audio_comments = ['', 'Comments']  # New row for comments
                    # Questions header. Examples header: Example and Comment
                    header_list = ['Name', 'Date']
                    for x in row['items']:
                        t = build_ape_header(x)
                        if t is not None:
                            header_list += t
                            # Give medias spaces
                            if x['type'] == 2:  # Example
                                if 'example' in x and 'medias' in x['example']:
                                    header_list += [''] * (len(x['example']['medias']) - 1) * 2
                                    # audio_names += [a['filename'] for a in x['example']['medias']]
                                    for a in x['example']['medias']:
                                        audio_names.append(a['filename'])
                                        audio_names.append('')
                                    
                                    # audio_comments += [a.get('comment', '') for a in x['example']['medias']]  # Add comments
                            else:
                                audio_names.append('')
                                # audio_comments.append('')  # Add empty comment
                            # Check if it is timed
                            if check_is_timed(row):
                                header_list.append('Time (s)')
                                audio_names.append('')
                                # audio_comments.append('')  # Add empty comment
                    writer.writerow(audio_names)
                    # writer.writerow(audio_comments)  # Write comments row
                    writer.writerow(header_list)
                    is_header_writen = True

                # Build three different lists of data
                value_list = [row['name'], row['createdAt'].strftime("%Y-%m-%d %H:%M:%S")]
                for x in row['items']:
                    t = build_ape_row(x)
                    if t is not None:
                        value_list += t
                        if check_is_timed(row):
                            value_list.append(str(x['time']) if 'time' in x else '0')

                # Append these three list and write
                writer.writerow(value_list)
        # Read and write stream
        with open(csv_filename, 'rb') as f:
            self.write(f.read())
            await self.finish()
        os.remove(csv_filename)


# Ape is special test that requires multiple columns for a question
def build_ape_row(item):
    if item['type'] == 1:  # Question
        if 'questionControl' in item and 'value' in item['questionControl']:
            return [item['questionControl']['value'] or '']
        return ''

    elif item['type'] == 2:  # Example
        if 'example' in item and 'medias' in item['example']:
            # row_values = [(a['value'] or '') if 'value' in a else '' for a in item['example']['medias']]
            # row_values += [(a['comment'] or '') if 'comment' in a else '' for a in item['example']['medias']]
            row_values = []
            for a in item['example']['medias']:
                if 'value' in a :
                    row_values.append((a['value'] or '') if 'value' in a else '')
                    row_values.append((a['comment'] or '') if 'comment' in a else '')
                else :
                    row_values.append('')
                    row_values.append('')
            return row_values
        return ''

    elif item['type'] == 3:  # Training with only one 'ask a question'
        if 'example' in item and 'fields' in item['example']:
            row_values = []
            for a in item['example']['fields']:
                # Field is description
                if 'type' in a and a['type'] == 3:
                    continue
                row_values.append((a['value'] or '') if 'value' in a else '')
            # return f'"{item["example"]["fields"][1]["value"] or ""}"'
            return [row_values[-1] if row_values else '']
        return ''
    else:
        return None


def build_ape_header(item, suffix=['rating','comment']):
    """
    Build the row of header for a CSV file
    :param item: A test item, normally the first test item in responses of a test
    :param suffix: This will be using in a test with rating bar
    :return: CSV format string including double quota
    """
    if item['type'] == 1:  # Question
        if 'questionControl' in item and 'question' in item['questionControl']:
            return [item['questionControl']['question'] or '']
        else:
            return ''
    elif item['type'] == 2:  # Example with suffix or training
        if 'example' in item:
            return [item['title'] + ' ' + (s if item['type'] == 2 else '') for s in suffix]
        else:
            return ''
    elif item['type'] == 3:  # Training
        return [item['title']]
    else:  # 0: Section header
        return None